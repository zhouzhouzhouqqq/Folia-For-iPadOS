import Capacitor
import AVFoundation
import AVKit
import MediaPlayer
import UIKit
import UniformTypeIdentifiers
import OSLog

// App-local platform boundary: files and OS media controls; playback remains in Folia's shared graph.
@objc(FoliaDevicePlugin)
public final class FoliaDevicePlugin: CAPPlugin, CAPBridgedPlugin, UIDocumentPickerDelegate {
    public let identifier = "FoliaDevicePlugin"
    public let jsName = "FoliaDevice"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startScreenRecording", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopScreenRecording", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getScreenRecordingState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "configureAudio", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setMusicControls", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "publishNowPlaying", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showOutputPicker", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getStorage", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "importLibrary", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "listFiles", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "statFile", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeFile", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "appendFile", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeFile", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "shareFile", returnType: CAPPluginReturnPromise)
    ]
    private let fileQueue = DispatchQueue(label: "org.folia.personal.files", qos: .userInitiated)
    var recordingBusy = false
    var pickerImportsFiles = false
    var pickerCall: CAPPluginCall?
    var commandTargets: [(MPRemoteCommand, Any)] = []
    var observers: [NSObjectProtocol] = []
    var webMediaSessionOwner: Bool?
    var musicControlAvailability: (next: Bool, previous: Bool)?
    private let audioLogger = Logger(subsystem: Bundle.main.bundleIdentifier ?? "org.folia.personal", category: "AudioSession")
    var artworkKey: String?
    var artworkItem: MPMediaItemArtwork?
    var root: URL {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("Folia", isDirectory: true)
    }

    public override func load() {
        try? FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        let center = NotificationCenter.default
        observers.append(center.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { [weak self] note in
            let type = (note.userInfo?[AVAudioSessionInterruptionTypeKey] as? NSNumber)?.uintValue ?? 0
            let options = (note.userInfo?[AVAudioSessionInterruptionOptionKey] as? NSNumber)?.uintValue ?? 0
            let reason = (note.userInfo?[AVAudioSessionInterruptionReasonKey] as? NSNumber)?.uintValue ?? 0
            self?.audioLogger.info("System interruption type=\(type) options=\(options) reason=\(reason)")
            self?.notifyListeners("audioInterruption", data: ["began": type == AVAudioSession.InterruptionType.began.rawValue,
                "shouldResume": options & AVAudioSession.InterruptionOptions.shouldResume.rawValue != 0])
        })
        observers.append(center.addObserver(forName: AVAudioSession.routeChangeNotification, object: nil, queue: .main) { [weak self] note in
            let reason = (note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? NSNumber)?.uintValue ?? 0
            self?.notifyListeners("audioRouteChanged", data: ["oldDeviceUnavailable": reason == AVAudioSession.RouteChangeReason.oldDeviceUnavailable.rawValue])
        })
        observers.append(center.addObserver(forName: UIApplication.didBecomeActiveNotification, object: nil, queue: .main) { [weak self] _ in
            self?.restoreMusicControls()
            self?.notifyListeners("foreground", data: [:])
        })
        observers.append(center.addObserver(forName: UIApplication.didEnterBackgroundNotification, object: nil, queue: .main) { [weak self] _ in
            self?.restoreMusicControls()
            let session = AVAudioSession.sharedInstance()
            self?.audioLogger.info("Entered background category=\(session.category.rawValue, privacy: .public) mode=\(session.mode.rawValue, privacy: .public)")
        })
    }

    deinit {
        for observer in observers { NotificationCenter.default.removeObserver(observer) }
        for (command, target) in commandTargets { command.removeTarget(target) }
    }

    @objc func configureAudio(_ call: CAPPluginCall) {
        do {
            let session = AVAudioSession.sharedInstance()
            // Playback already supports AirPlay/A2DP. allowAirPlay is only valid with playAndRecord (SDK contract).
            // Reapplying an unchanged category on every playing event can also needlessly reconfigure the route.
            if session.category != .playback || session.mode != .default || !session.categoryOptions.isEmpty {
                try session.setCategory(.playback, mode: .default, options: [])
            }
            // WKWebView's media/Web Audio session owns audio focus. Activating the silent host
            // session here competes with WebKit's exclusive playback session, including when
            // configureAudio is called from `playing`, and can immediately interrupt that media.
            // WebKit owns Now Playing as well as audio. Host metadata/targets otherwise address
            // a silent session and compete with the system controls for the WKWebView player.
            let useWebMediaSession = call.getBool("webMediaSession") ?? true
            if webMediaSessionOwner != useWebMediaSession {
                for (command, target) in commandTargets { command.removeTarget(target) }
                commandTargets.removeAll()
                if webMediaSessionOwner == false {
                    MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
                    artworkKey = nil; artworkItem = nil
                }
                webMediaSessionOwner = useWebMediaSession
                audioLogger.info("Media controls configured; WebKit owner=\(useWebMediaSession)")
            }
            if !useWebMediaSession && commandTargets.isEmpty {
                let center = MPRemoteCommandCenter.shared()
                let commands: [(MPRemoteCommand, String)] = [
                    (center.playCommand, "play"), (center.pauseCommand, "pause"),
                    (center.togglePlayPauseCommand, "toggle"), (center.nextTrackCommand, "next"),
                    (center.previousTrackCommand, "previous"), (center.changePlaybackPositionCommand, "seek")
                ]
                for (command, action) in commands {
                    command.isEnabled = true
                    let target = command.addTarget { [weak self] event in
                        var data: [String: Any] = ["action": action]
                        if let seek = event as? MPChangePlaybackPositionCommandEvent { data["position"] = seek.positionTime }
                        self?.notifyListeners("remoteCommand", data: data)
                        return .success
                    }
                    commandTargets.append((command, target))
                }
                DispatchQueue.main.async { [weak self] in
                    self?.musicControlAvailability = (true, true)
                    self?.restoreMusicControls()
                }
            }
            call.resolve()
        } catch {
            audioLogger.error("Media session configuration failed: \(error.localizedDescription, privacy: .public)")
            call.reject("Media session could not configure: \(error.localizedDescription)", "AUDIO_SESSION_CONFIGURATION_FAILED", error)
        }
    }

    @objc func publishNowPlaying(_ call: CAPPluginCall) {
        // A late fallback bridge message must never overwrite the active WebKit session.
        guard webMediaSessionOwner != true else { call.resolve(); return }
        if call.getBool("clear") == true {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
            artworkKey = nil; artworkItem = nil
            call.resolve(); return
        }
        let playing = call.getBool("playing") ?? false
        let key = call.getString("trackKey")
        if key != artworkKey { artworkKey = key; artworkItem = nil }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = [
            MPMediaItemPropertyTitle: call.getString("title") ?? "",
            MPMediaItemPropertyArtist: call.getString("artist") ?? "",
            MPMediaItemPropertyAlbumTitle: call.getString("album") ?? "",
            MPMediaItemPropertyPlaybackDuration: max(0, call.getDouble("duration") ?? 0),
            MPNowPlayingInfoPropertyElapsedPlaybackTime: max(0, call.getDouble("position") ?? 0),
            MPNowPlayingInfoPropertyPlaybackRate: playing ? (call.getDouble("rate") ?? 1) : 0
        ]
        // Artwork is accepted only as bounded image bytes from the current renderer, never fetched with credentials here.
        if let raw = call.getString("artwork"), let data = Data(base64Encoded: raw), data.count <= 4_000_000,
           let image = UIImage(data: data) {
            artworkItem = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
        }
        if let artworkItem { MPNowPlayingInfoCenter.default().nowPlayingInfo?[MPMediaItemPropertyArtwork] = artworkItem }
        call.resolve()
    }

    // Choose music navigation without claiming WebKit's audio focus, metadata, or command targets.
    func restoreMusicControls() {
        guard let availability = musicControlAvailability else { return }
        let center = MPRemoteCommandCenter.shared()
        center.skipForwardCommand.isEnabled = false
        center.skipBackwardCommand.isEnabled = false
        center.seekForwardCommand.isEnabled = false
        center.seekBackwardCommand.isEnabled = false
        center.nextTrackCommand.isEnabled = availability.next
        center.previousTrackCommand.isEnabled = availability.previous
        // changePlaybackPositionCommand belongs to WebKit: keep the draggable progress bar.
    }

    @objc func setMusicControls(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { call.reject("Media controls unavailable"); return }
            let requested = (next: call.getBool("next") ?? false, previous: call.getBool("previous") ?? false)
            let changed = self.musicControlAvailability?.next != requested.next || self.musicControlAvailability?.previous != requested.previous
            self.musicControlAvailability = requested
            self.restoreMusicControls()
            let center = MPRemoteCommandCenter.shared()
            if changed {
                self.audioLogger.info("Music buttons next=\(center.nextTrackCommand.isEnabled) previous=\(center.previousTrackCommand.isEnabled) skipForward=\(center.skipForwardCommand.isEnabled) skipBackward=\(center.skipBackwardCommand.isEnabled)")
            }
            call.resolve(["next": center.nextTrackCommand.isEnabled, "previous": center.previousTrackCommand.isEnabled,
                "skipForward": center.skipForwardCommand.isEnabled, "skipBackward": center.skipBackwardCommand.isEnabled])
        }
    }

    @objc func showOutputPicker(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let host = self?.bridge?.viewController else { call.reject("No active view"); return }
            let controller = UIViewController()
            controller.preferredContentSize = CGSize(width: 260, height: 120)
            controller.view.backgroundColor = .systemBackground
            let picker = AVRoutePickerView(frame: CGRect(x: 80, y: 20, width: 100, height: 80))
            picker.prioritizesVideoDevices = false
            controller.view.addSubview(picker)
            controller.modalPresentationStyle = .popover
            controller.popoverPresentationController?.sourceView = host.view
            controller.popoverPresentationController?.sourceRect = CGRect(x: host.view.bounds.midX, y: host.view.bounds.midY, width: 1, height: 1)
            host.present(controller, animated: true) { call.resolve() }
        }
    }

    @objc func getStorage(_ call: CAPPluginCall) { call.resolve(["uri": root.absoluteString]) }

    // Every path is relative to the private root; symlinks and path traversal cannot escape it.
    func fileURL(_ path: String) throws -> URL {
        guard !path.hasPrefix("/"), !path.split(separator: "/").contains("..") else { throw CocoaError(.fileReadNoPermission) }
        let target = root.appendingPathComponent(path).standardizedFileURL.resolvingSymlinksInPath()
        let prefix = root.standardizedFileURL.resolvingSymlinksInPath().path + "/"
        guard target.path == root.path || target.path.hasPrefix(prefix) else { throw CocoaError(.fileReadNoPermission) }
        return target
    }

    @objc func importLibrary(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self, let host = self.bridge?.viewController else { call.reject("No active view"); return }
            guard self.pickerCall == nil else { call.reject("A file picker is already open"); return }
            self.pickerCall = call
            let showPicker: (Bool) -> Void = { files in
                self.pickerImportsFiles = files
                let types: [UTType] = switch call.getString("accept") {
                case "video": [.movie]
                case "audio": [.audio]
                case "image": [.image]
                default: [.item]
                }
                let picker = UIDocumentPickerViewController(forOpeningContentTypes: files ? types : [.folder], asCopy: false)
                picker.allowsMultipleSelection = files && call.getBool("single") != true
                picker.delegate = self
                host.present(picker, animated: true)
            }
            if let files = call.getBool("files") { showPicker(files); return }
            let chooser = UIAlertController(title: call.getString("title") ?? "Import a copy", message: nil, preferredStyle: .actionSheet)
            chooser.addAction(UIAlertAction(title: call.getString("folderLabel") ?? "Choose folder", style: .default) { _ in showPicker(false) })
            chooser.addAction(UIAlertAction(title: call.getString("filesLabel") ?? "Choose audio and lyric files", style: .default) { _ in showPicker(true) })
            chooser.addAction(UIAlertAction(title: call.getString("cancelLabel") ?? "Cancel", style: .cancel) { _ in
                self.pickerCall?.resolve(["cancelled": true]); self.pickerCall = nil
            })
            chooser.popoverPresentationController?.sourceView = host.view
            chooser.popoverPresentationController?.sourceRect = CGRect(x: host.view.bounds.midX, y: host.view.bounds.midY, width: 1, height: 1)
            host.present(chooser, animated: true)
        }
    }

    public func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        pickerCall?.resolve(["cancelled": true]); pickerCall = nil
    }

    // Security-scoped access lasts only for coordinated copying; the app never retains external directory permissions.
    public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let call = pickerCall else { return }
        pickerCall = nil
        let importsFiles = pickerImportsFiles
        // Coordinated provider downloads and large copies must not block the WebKit/UI thread.
        fileQueue.async { [self] in
            let id = UUID().uuidString
            let folderName = (urls.count == 1 && !importsFiles ? urls[0].lastPathComponent : "Import") + "-" + id.prefix(8)
            let relativePath = "libraries/" + id + "/" + folderName
            do {
                let destination = try fileURL(relativePath)
                try FileManager.default.createDirectory(at: destination, withIntermediateDirectories: true)
                for source in urls {
                    let accessed = source.startAccessingSecurityScopedResource()
                    defer { if accessed { source.stopAccessingSecurityScopedResource() } }
                    var coordinatorError: NSError?
                    var copyError: Error?
                    NSFileCoordinator().coordinate(readingItemAt: source, options: [], error: &coordinatorError) { coordinated in
                        do {
                            if !importsFiles {
                                try FileManager.default.removeItem(at: destination)
                                try FileManager.default.copyItem(at: coordinated, to: destination)
                            } else {
                                try FileManager.default.copyItem(at: coordinated, to: destination.appendingPathComponent(coordinated.lastPathComponent))
                            }
                        } catch { copyError = error }
                    }
                    if let coordinatorError { throw coordinatorError }
                    if let copyError { throw copyError }
                }
                call.resolve(["path": relativePath, "name": folderName, "cancelled": false])
            } catch {
                if let partial = try? fileURL("libraries/" + id) { try? FileManager.default.removeItem(at: partial) }
                call.reject("Import copy failed", nil, error)
            }
        }
    }

    @objc func listFiles(_ call: CAPPluginCall) {
        fileQueue.async { [self] in
            do {
                let directory = try fileURL(call.getString("path") ?? "")
                let entries = try FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: [.isDirectoryKey, .isSymbolicLinkKey])
                let values: [[String: Any]] = try entries.compactMap { url in
                    let resource = try url.resourceValues(forKeys: [.isDirectoryKey, .isSymbolicLinkKey])
                    guard resource.isSymbolicLink != true else { return nil }
                    return ["name": url.lastPathComponent, "kind": resource.isDirectory == true ? "directory" : "file"]
                }
                call.resolve(["entries": values])
            } catch { call.reject("Directory unavailable", nil, error) }
        }
    }

    @objc func statFile(_ call: CAPPluginCall) {
        fileQueue.async { [self] in
            do {
                let url = try fileURL(call.getString("path") ?? "")
                let values = try url.resourceValues(forKeys: [.fileSizeKey, .contentModificationDateKey, .isDirectoryKey])
                call.resolve(["uri": url.absoluteString, "size": values.fileSize ?? 0,
                    "modified": (values.contentModificationDate?.timeIntervalSince1970 ?? 0) * 1000,
                    "directory": values.isDirectory ?? false])
            } catch { call.reject("File unavailable", nil, error) }
        }
    }

    @objc func writeFile(_ call: CAPPluginCall) {
        fileQueue.async { [self] in
            do {
                guard let raw = call.getString("data"), raw.count <= 32_000_000, let data = Data(base64Encoded: raw) else {
                    call.reject("Invalid or oversized file data"); return
                }
                let url = try fileURL(call.getString("path") ?? "")
                guard url != root else { call.reject("Invalid file path"); return }
                try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
                try data.write(to: url, options: .atomic)
                call.resolve(["uri": url.absoluteString])
            } catch { call.reject("File write failed", nil, error) }
        }
    }

    @objc func appendFile(_ call: CAPPluginCall) {
        fileQueue.async { [self] in
            do {
                guard let raw = call.getString("data"), raw.count <= 2_000_000, let data = Data(base64Encoded: raw) else {
                    call.reject("Invalid chunk"); return
                }
                let url = try fileURL(call.getString("path") ?? "")
                let handle = try FileHandle(forWritingTo: url)
                defer { try? handle.close() }
                try handle.seekToEnd()
                try handle.write(contentsOf: data)
                call.resolve()
            } catch { call.reject("File chunk write failed", nil, error) }
        }
    }

    @objc func removeFile(_ call: CAPPluginCall) {
        fileQueue.async { [self] in
            do {
                let url = try fileURL(call.getString("path") ?? "")
                guard url != root else { call.reject("Cannot remove storage root"); return }
                if FileManager.default.fileExists(atPath: url.path) { try FileManager.default.removeItem(at: url) }
                call.resolve()
            } catch { call.reject("File removal failed", nil, error) }
        }
    }

    @objc func shareFile(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            do {
                guard let self, let host = self.bridge?.viewController else { call.reject("No active view"); return }
                let url = try self.fileURL(call.getString("path") ?? "")
                let controller = UIActivityViewController(activityItems: [url], applicationActivities: nil)
                controller.popoverPresentationController?.sourceView = host.view
                controller.popoverPresentationController?.sourceRect = CGRect(x: host.view.bounds.midX, y: host.view.bounds.midY, width: 1, height: 1)
                controller.completionWithItemsHandler = { _, completed, _, error in
                    if let error { call.reject("Share failed", nil, error) } else { call.resolve(["completed": completed]) }
                }
                host.present(controller, animated: true)
            } catch { call.reject("File unavailable", nil, error) }
        }
    }
}

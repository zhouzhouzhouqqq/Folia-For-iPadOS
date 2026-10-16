import Capacitor
import ReplayKit

// Native real-time capture preserves the visible renderer; it does not promise desktop offline rendering or alpha output.
extension FoliaDevicePlugin: RPScreenRecorderDelegate {
    @objc func startScreenRecording(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { call.reject("Plugin unavailable"); return }
            let recorder = RPScreenRecorder.shared()
            guard recorder.isAvailable, !recorder.isRecording, !self.recordingBusy else { call.reject("Recording unavailable or already active"); return }
            self.recordingBusy = true
            recorder.delegate = self
            recorder.isMicrophoneEnabled = false
            recorder.startRecording { error in
                self.recordingBusy = false
                if let error { call.reject("ReplayKit could not start", nil, error); return }
                self.notifyListeners("screenRecording", data: ["recording": true])
                call.resolve()
            }
        }
    }

    @objc func stopScreenRecording(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { call.reject("Plugin unavailable"); return }
            let recorder = RPScreenRecorder.shared()
            guard recorder.isRecording, !self.recordingBusy else { call.reject("No active recording"); return }
            self.recordingBusy = true
            do {
                let path = "exports/" + UUID().uuidString + "/Folia-recording.mp4"
                let url = try self.fileURL(path)
                try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
                recorder.stopRecording(withOutput: url) { error in
                    self.recordingBusy = false
                    self.notifyListeners("screenRecording", data: ["recording": false])
                    if let error { call.reject("ReplayKit could not save", nil, error); return }
                    call.resolve(["path": path])
                }
            } catch { self.recordingBusy = false; call.reject("Recording path unavailable", nil, error) }
        }
    }

    @objc func getScreenRecordingState(_ call: CAPPluginCall) {
        call.resolve(["recording": RPScreenRecorder.shared().isRecording])
    }

    public func screenRecorder(_ screenRecorder: RPScreenRecorder, didStopRecordingWith previewViewController: RPPreviewViewController?, error: Error?) {
        recordingBusy = false
        notifyListeners("screenRecording", data: ["recording": false, "interrupted": true])
    }
}

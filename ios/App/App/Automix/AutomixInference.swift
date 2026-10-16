import Foundation
import FoliaAutomixRuntime

// Disk-backed tensor transport prevents 30 seconds of stereo/stems from becoming huge bridge JSON objects.
final class AutomixCancellation: @unchecked Sendable {
    private let lock = NSLock()
    private var stopped = false
    func cancel() { lock.lock(); stopped = true; lock.unlock() }
    func check() -> Bool { lock.lock(); defer { lock.unlock() }; return stopped }
}
struct AutomixFiles {
    let root: URL
    init(storageRoot: URL? = nil) throws {
        let directory = try storageRoot ?? FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask,
            appropriateFor: nil, create: true).appendingPathComponent("Folia/automix-bridge", isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        // iOS may expose /var via a system symlink; canonicalize the root before rejecting job links.
        root = directory.resolvingSymlinksInPath()
        // Only constructed once per plugin lifetime; all leftovers are from an interrupted previous run.
        try? FileManager.default.removeItem(at: root)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        var url = root, values = URLResourceValues(); values.isExcludedFromBackup = true
        try url.setResourceValues(values)
    }
    func job(_ id: String) throws -> URL {
        guard UUID(uuidString: id) != nil, id == UUID(uuidString: id)?.uuidString else { throw AutomixRuntimeError.invalid("Invalid inference job") }
        let url = root.appendingPathComponent(id, isDirectory: true)
        guard url.resolvingSymlinksInPath().path == url.path else { throw AutomixRuntimeError.invalid("Invalid job directory") }
        return url
    }
    func create() throws -> String {
        let id = UUID().uuidString
        try FileManager.default.createDirectory(at: job(id), withIntermediateDirectories: false)
        return id
    }
    func remove(_ id: String) throws { try FileManager.default.removeItem(at: job(id)) }
    func read(_ id: String, count: Int) throws -> [Float] {
        guard count > 0, count <= 256 * 1500 * 128 else { throw AutomixRuntimeError.invalid("Invalid tensor length") }
        let file = try job(id).appendingPathComponent("input.f32")
        let info = try file.resourceValues(forKeys: [.isSymbolicLinkKey, .fileSizeKey, .isRegularFileKey])
        guard info.isSymbolicLink != true, info.isRegularFile == true, info.fileSize == count * 4 else { throw AutomixRuntimeError.invalid("Tensor file size mismatch") }
        let data = try Data(contentsOf: file, options: .mappedIfSafe)
        guard data.count == count * 4 else { throw AutomixRuntimeError.invalid("Tensor file size changed") }
        // Copy once into aligned Float storage; Data's address is not guaranteed to be Float-aligned.
        let values = [Float](unsafeUninitializedCapacity: count) { buffer, initialized in
            data.withUnsafeBytes { raw in
                UnsafeMutableRawPointer(buffer.baseAddress!).copyMemory(from: raw.baseAddress!, byteCount: raw.count)
            }
            initialized = count
        }
        guard values.allSatisfy(\.isFinite) else { throw AutomixRuntimeError.invalid("Nonfinite input tensor") }
        return values
    }
    func write(_ id: String, arrays: [[Float]]) throws -> String {
        let url = try job(id).appendingPathComponent("output.f32")
        FileManager.default.createFile(atPath: url.path, contents: nil)
        let handle = try FileHandle(forWritingTo: url)
        defer { try? handle.close() }
        for array in arrays { try array.withUnsafeBytes { try handle.write(contentsOf: Data($0)) } }
        return "automix-bridge/\(id)/output.f32"
    }
}
actor AutomixEngine {
    private let store: AutomixModelStore, files: AutomixFiles
    private let queue = DispatchQueue(label: "org.folia.automix.inference", qos: .utility)
    private var active: (String, AutomixCancellation)?
    private var download: AutomixDownload?
    private var editing = false
    private var foreground = true
    private var downloadCancellation: AutomixCancellation?
    init(foreground: Bool = true) throws {
        self.foreground = foreground
        store = try AutomixModelStore(); files = try AutomixFiles()
    }
    func status() async -> [String: Bool] { await store.status() }
    func create() throws -> String { try files.create() }
    func clean(_ id: String) throws { guard active?.0 != id else { throw AutomixRuntimeError.invalid("Inference still active") }; try files.remove(id) }
    func cancel() { active?.1.cancel(); downloadCancellation?.cancel(); download?.cancel() }
    func setForeground(_ value: Bool) { foreground = value; if !value { cancel() } }
    func remove(_ name: String) async throws {
        guard active == nil, !editing else { throw AutomixRuntimeError.invalid("AutoMix engine is busy") }
        editing = true; defer { editing = false }
        try await store.remove(name)
    }
    func install(_ source: URL, name: String) async throws {
        guard active == nil, !editing else { throw AutomixRuntimeError.invalid("AutoMix engine is busy") }
        editing = true; defer { editing = false }
        try await store.install(source, name: name)
    }
    func fetch(_ name: String, progress: @escaping (Double) -> Void) async throws {
        guard active == nil, !editing else { throw AutomixRuntimeError.invalid("AutoMix engine is busy") }
        editing = true
        let token = AutomixCancellation(); downloadCancellation = token
        defer { editing = false; download = nil; downloadCancellation = nil }
        let model = try await store.model(name)
        var last: Error = URLError(.cannotConnectToHost)
        for mirror in AutomixModel.mirrors {
            if token.check() { throw CancellationError() }
            let downloader = AutomixDownload(expected: model.bytes, progress: progress); download = downloader
            do {
                let url = try await downloader.start(URL(string: mirror.replacingOccurrences(of: "{file}", with: model.file))!)
                defer { try? FileManager.default.removeItem(at: url) }
                if token.check() { throw CancellationError() }
                try await store.install(url, name: name)
                return
            } catch is CancellationError { throw CancellationError() }
            catch let error as URLError where error.code == .cancelled { throw CancellationError() }
            catch { last = error }
        }
        throw last
    }
    func infer(id: String, kind: String, frames: [Int], samples: Int) async throws -> String {
        guard active == nil, !editing else { throw AutomixRuntimeError.invalid("AutoMix engine is busy") }
        guard foreground else { throw AutomixRuntimeError.invalid("AutoMix analysis waits for the foreground") }
        guard kind == "beat_this" || kind == "htdemucs" else { throw AutomixRuntimeError.invalid("Invalid model") }
        if kind == "beat_this" {
            guard !frames.isEmpty, frames.count <= 256, frames.allSatisfy({ (1...1500).contains($0) }) else { throw AutomixRuntimeError.invalid("Invalid beat frames") }
        } else {
            guard samples > 0, samples <= 44_100 * 30 else { throw AutomixRuntimeError.invalid("Invalid stem samples") }
        }
        let token = AutomixCancellation(); active = (id, token)
        defer { active = nil }
        let path = try await store.path(kind), files = self.files
        return try await withCheckedThrowingContinuation { continuation in
            queue.async {
                do {
                    if token.check() { throw CancellationError() }
                    let output: [[Float]]
                    if kind == "beat_this" {
                        let input = try files.read(id, count: frames.reduce(0, +) * 128)
                        var at = 0
                        let chunks = frames.map { count -> (frames: Int, data: [Float]) in
                            defer { at += count * 128 }; return (count, Array(input[at..<at + count * 128]))
                        }
                        let result = try NativeBeatThis.run(path: path, chunks: chunks, cancelled: token.check)
                        output = zip(result.beat, result.downbeat).flatMap { [$0, $1] }
                    } else {
                        let input = try files.read(id, count: samples * 2)
                        output = try NativeHTDemucs.run(path: path, left: Array(input.prefix(samples)), right: Array(input.suffix(samples)), cancelled: token.check)
                    }
                    if token.check() { throw CancellationError() }
                    continuation.resume(returning: try files.write(id, arrays: output))
                } catch { continuation.resume(throwing: error) }
            }
        }
    }
}

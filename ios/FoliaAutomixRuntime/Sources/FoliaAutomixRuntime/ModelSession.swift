import Foundation
import FoliaORTC

// One native inference session, explicitly released after a request so weights do not sit beside the visualizer.
public enum AutomixRuntimeError: LocalizedError {
    case invalid(String)
    public var errorDescription: String? { if case let .invalid(text) = self { return text }; return nil }
}
final class ModelSession {
    private let handle: OpaquePointer
    init(path: String, parallel: Bool = false) throws {
        var error: UnsafeMutablePointer<CChar>?
        guard let session = fmort_create(path, parallel ? 1 : 0, &error) else { throw Self.failure(error) }
        handle = session
    }
    deinit { fmort_destroy(handle) }
    static func failure(_ pointer: UnsafeMutablePointer<CChar>?) -> AutomixRuntimeError {
        defer { fmort_free_error(pointer) }
        return .invalid(pointer.map { String(cString: $0) } ?? "Native model failed")
    }
    func shape(_ index: Int32) -> [Int] {
        var dims = [Int64](repeating: 0, count: 8)
        let rank = fmort_input_shape(handle, index, &dims, 8)
        return rank > 0 ? dims.prefix(Int(rank)).map(Int.init) : []
    }
    func run(_ first: [Float], frames: Int32 = 0, second: [Float] = []) throws -> [[Float]] {
        try withOutputs(first, frames: frames, second: second) { $0.map(Array.init) }
    }
    // Views must be consumed inside body; ORT tensors are released on success and on thrown errors.
    func withOutputs<T>(_ first: [Float], frames: Int32 = 0, second: [Float] = [],
                        body: ([UnsafeBufferPointer<Float>]) throws -> T) throws -> T {
        var error: UnsafeMutablePointer<CChar>?
        var outputs = [FMORTOutput](repeating: FMORTOutput(), count: 2)
        defer { for index in outputs.indices { fmort_free_output(&outputs[index]) } }
        let count = first.withUnsafeBufferPointer { a in second.withUnsafeBufferPointer { b in
            fmort_run(handle, a.baseAddress, a.count, frames, b.baseAddress, b.count, &outputs, 2, &error)
        } }
        guard count > 0 else { throw Self.failure(error) }
        return try body(outputs.prefix(Int(count)).map { UnsafeBufferPointer(start: $0.data, count: $0.count) })
    }
}
public enum NativeBeatThis {
    public static func run(path: String, chunks: [(frames: Int, data: [Float])], cancelled: () -> Bool = { false }) throws -> (beat: [[Float]], downbeat: [[Float]]) {
        guard !chunks.isEmpty, chunks.count <= 256 else { throw AutomixRuntimeError.invalid("Invalid beat chunks") }
        if cancelled() { throw CancellationError() }
        let session = try ModelSession(path: path)
        var beat = [[Float]](), downbeat = [[Float]]()
        for chunk in chunks {
            if cancelled() { throw CancellationError() }
            guard (1...1500).contains(chunk.frames), chunk.data.count == chunk.frames * 128, chunk.data.allSatisfy(\.isFinite) else { throw AutomixRuntimeError.invalid("Invalid spectrogram shape") }
            let result = try session.run(chunk.data, frames: Int32(chunk.frames))
            guard result.count == 2, result.allSatisfy({ $0.count == chunk.frames && $0.allSatisfy(\.isFinite) }) else { throw AutomixRuntimeError.invalid("Beat output shape mismatch") }
            beat.append(result[0]); downbeat.append(result[1])
        }
        return (beat, downbeat)
    }
}

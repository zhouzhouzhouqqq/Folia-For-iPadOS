import Foundation
import Darwin
import Testing
@testable import FoliaAutomixRuntime

// DSP checks use synthetic audio only. Optional real-model parity emits fixtures for the unchanged Python runner.
@Suite(.serialized) struct RuntimeTests {
@Test func fftRoundTripAndFiniteShapes() throws {
    let segment = 172_032, fft = try HTDemucsFFT(shape: [344, 2049, 2], segment: 172_032)
    let signal: [Float] = (0..<segment * 2).map { index in
        let x = Double(index)
        return Float(sin(x * 0.031) * 0.1 + cos(x * 0.057) * 0.07)
    }
    let encoded = try fft.encode(signal)
    let full = Array(repeating: encoded, count: 4).flatMap { $0 }
    let decoded = try fft.decode(full, time: [Float](repeating: 0, count: segment * 8))
    let finite = decoded.allSatisfy { $0.isFinite }
    #expect(finite)
    let maxError = decoded.enumerated().map { abs($0.element - signal[$0.offset % signal.count]) }.max() ?? 1
    #expect(maxError < 1e-6)
    let selectedChannels = [0, 1, 2, 3, 6, 7]
    let selected = try fft.decode(full, time: [Float](repeating: 0, count: segment * 8), channels: selectedChannels)
    for (target, source) in selectedChannels.enumerated() {
        #expect(Array(selected[target * segment..<(target + 1) * segment]) == Array(decoded[source * segment..<(source + 1) * segment]))
    }
    #expect(throws: AutomixRuntimeError.self) { try fft.decode(full, time: decoded, channels: [8]) }
    #expect(throws: AutomixRuntimeError.self) { try fft.encode([0]) }
    #expect(throws: AutomixRuntimeError.self) { try fft.decode([0], time: [0]) }
}
@Test func rejectedShapesAndInputs() throws {
    #expect(throws: AutomixRuntimeError.self) { try HTDemucsFFT(shape: [1], segment: 172032) }
    #expect(throws: AutomixRuntimeError.self) { try NativeHTDemucs.run(path: "/absent", left: [1], right: [1, 2]) }
    #expect(throws: AutomixRuntimeError.self) { try NativeHTDemucs.run(path: "/absent", left: [.nan], right: [1]) }
    #expect(throws: AutomixRuntimeError.self) { try NativeBeatThis.run(path: "/absent", chunks: []) }
    #expect(throws: CancellationError.self) { try NativeBeatThis.run(path: "/absent", chunks: [(1, [Float](repeating: 0, count: 128))], cancelled: { true }) }
    #expect(throws: CancellationError.self) { try NativeHTDemucs.run(path: "/absent", left: [1], right: [1], cancelled: { true }) }
}
@Test func originalModelsSyntheticParity() throws {
    let environment = ProcessInfo.processInfo.environment
    guard let models = environment["FOLIA_AUTOMIX_TEST_MODELS"], let destination = environment["FOLIA_AUTOMIX_TEST_OUTPUT"] else { return }
    let root = URL(fileURLWithPath: destination, isDirectory: true)
    try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
    func save(_ name: String, _ array: [Float]) throws {
        try array.withUnsafeBytes { try Data($0).write(to: root.appendingPathComponent(name)) }
    }
    let frames = 100
    let mel = (0..<frames * 128).map { Float(sin(Double($0) * 0.013) * 0.4) }
    try save("mel.f32", mel)
    var durations = [String: Double]()
    var started = ProcessInfo.processInfo.systemUptime
    let beat = try NativeBeatThis.run(path: models + "/beat_this.onnx", chunks: [(frames, mel)])
    durations["beatSeconds"] = ProcessInfo.processInfo.systemUptime - started
    try save("beat.f32", beat.beat[0] + beat.downbeat[0])
    let seconds = min(30, max(5, Int(environment["FOLIA_AUTOMIX_TEST_SECONDS"] ?? "5") ?? 5))
    let count = 44_100 * seconds
    let left: [Float] = (0..<count).map { index in
        let x = Double(index)
        return Float(sin(x * 0.04) * 0.1 + cos(x * 0.011) * 0.03)
    }
    let right: [Float] = (0..<count).map { index in
        let x = Double(index)
        return Float(sin(x * 0.043) * 0.09 + cos(x * 0.013) * 0.04)
    }
    try save("input.f32", left + right)
    let fft = try HTDemucsFFT(shape: [344, 2049, 2], segment: 172032)
    let stereo = Array(left.prefix(172032)) + Array(right.prefix(172032))
    started = ProcessInfo.processInfo.systemUptime
    let encoded = try fft.encode(stereo)
    durations["encodeSeconds"] = ProcessInfo.processInfo.systemUptime - started
    try save("spectrum.f32", encoded)
    let spectral = Array(repeating: encoded, count: 4).flatMap { $0 }
    let time = [Float](repeating: 0, count: 8 * 172032)
    started = ProcessInfo.processInfo.systemUptime
    let decoded = try fft.decode(spectral, time: time)
    durations["decodeEightSeconds"] = ProcessInfo.processInfo.systemUptime - started
    #expect(decoded.count == time.count)
    started = ProcessInfo.processInfo.systemUptime
    let stems = try NativeHTDemucs.run(path: models + "/htdemucs-v2.onnx", left: left, right: right)
    durations["stemsSeconds"] = ProcessInfo.processInfo.systemUptime - started
    let valid = stems.count == 6 && stems.allSatisfy { $0.count == count && $0.allSatisfy { $0.isFinite } }
    #expect(valid)
    try save("stems.f32", stems.flatMap { $0 })
    var usage = rusage()
    getrusage(RUSAGE_SELF, &usage)
    print("Native synthetic inference completed: \(seconds)s; host process peak RSS \(usage.ru_maxrss) bytes (not iPad memory).")
    let metrics: [String: Any] = ["durations": durations, "peakRSSBytes": usage.ru_maxrss,
        "seconds": seconds, "syntheticOnly": true, "hostOS": ProcessInfo.processInfo.operatingSystemVersionString,
        "label": environment["FOLIA_AUTOMIX_BENCH_LABEL"] ?? "unspecified"]
    try JSONSerialization.data(withJSONObject: metrics, options: [.prettyPrinted, .sortedKeys])
        .write(to: root.appendingPathComponent("benchmark.json"))
}

@Test func borrowedOutputsReleaseAfterThrowingConsumer() throws {
    guard let models = ProcessInfo.processInfo.environment["FOLIA_AUTOMIX_TEST_MODELS"] else { return }
    let mel = [Float](repeating: 0.1, count: 128 * 100)
    let session = try ModelSession(path: models + "/beat_this.onnx")
    let original = try session.run(mel, frames: 100)
    // Throwing consumers must release ORT outputs without poisoning the session or any copied results.
    #expect(throws: AutomixRuntimeError.self) {
        try session.withOutputs(mel, frames: 100) { _ -> Void in throw AutomixRuntimeError.invalid("Consumer cancelled") }
    }
    #expect(try session.run(mel, frames: 100) == original)
}

}

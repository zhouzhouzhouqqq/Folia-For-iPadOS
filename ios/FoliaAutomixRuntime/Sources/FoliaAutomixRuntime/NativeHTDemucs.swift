import Accelerate
import Foundation

// Same segment shapes, source order and triangular overlap-add as electron/analysis/htdemucs_runner.py.
public enum NativeHTDemucs {
    public static func run(path: String, left: [Float], right: [Float], cancelled: () -> Bool = { false },
                           progress: (Int, Int) -> Void = { _, _ in }) throws -> [[Float]] {
        guard !left.isEmpty, left.count == right.count, left.count <= 44_100 * 30,
              left.allSatisfy(\.isFinite), right.allSatisfy(\.isFinite) else { throw AutomixRuntimeError.invalid("Invalid stereo stem window") }
        if cancelled() { throw CancellationError() }
        let session = try ModelSession(path: path, parallel: true), shape = session.shape(0)
        guard shape.count == 3, shape[0] == 1, shape[1] == 2, (4096...500_000).contains(shape[2]) else {
            throw AutomixRuntimeError.invalid("Unsupported HTDemucs time shape")
        }
        let segment = shape[2], total = left.count, overlap = segment / 4, stride = segment - overlap
        let fft = try HTDemucsFFT(shape: session.shape(1), segment: segment)
        var window = [Float](repeating: 1, count: segment)
        for j in 0..<overlap { let value = Float(j) / Float(overlap - 1); window[j] = value; window[segment - 1 - j] = value }
        var result = [[Float]](repeating: [Float](repeating: 0, count: total), count: 6)
        var weight = [Float](repeating: 0, count: total)
        var weighted = [Float](repeating: 0, count: segment)
        let chunks = max(1, (total + stride - 1) / stride)
        for chunk in 0..<chunks {
            if cancelled() { throw CancellationError() }
            let start = chunk * stride, count = min(segment, total - start)
            var input = [Float](repeating: 0, count: 2 * segment)
            input.replaceSubrange(0..<count, with: left[start..<start + count])
            input.replaceSubrange(segment..<segment + count, with: right[start..<start + count])
            let separated = try session.withOutputs(input, second: fft.encode(input)) { raw in
                guard raw.count == 2 else { throw AutomixRuntimeError.invalid("HTDemucs requires the FFT-cut export") }
                return try fft.decode(raw[0], time: raw[1], channels: [0, 1, 2, 3, 6, 7])
            }
            guard separated.allSatisfy(\.isFinite) else { throw AutomixRuntimeError.invalid("Nonfinite stem output") }
            // Return drums, bass, vocals. The original JS derives 'other' by subtraction for exact reconstruction.
            separated.withUnsafeBufferPointer { samples in
                for output in 0..<6 {
                    vDSP_vmul(samples.baseAddress! + output * segment, 1, &window, 1, &weighted, 1, vDSP_Length(count))
                    result[output].withUnsafeMutableBufferPointer { pcm in
                        let destination = pcm.baseAddress! + start
                        vDSP_vadd(&weighted, 1, destination, 1, destination, 1, vDSP_Length(count))
                    }
                }
            }
            weight.withUnsafeMutableBufferPointer { weights in
                let destination = weights.baseAddress! + start
                vDSP_vadd(&window, 1, destination, 1, destination, 1, vDSP_Length(count))
            }
            progress(chunk + 1, chunks)
        }
        for j in 0..<total { weight[j] = max(weight[j], 1e-8) }
        for channel in result.indices {
            result[channel].withUnsafeMutableBufferPointer { pcm in
                vDSP_vdiv(&weight, 1, pcm.baseAddress!, 1, pcm.baseAddress!, 1, vDSP_Length(total))
            }
        }
        return result
    }
}

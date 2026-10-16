import Accelerate
import Foundation

// Exact normalized STFT/iSTFT boundary of Folia's FFT-cut HTDemucs export; no audio playback here.
final class HTDemucsFFT {
    let n: Int, hop: Int, frames: Int, segment: Int
    private let forward: vDSP_DFT_SetupD, inverse: vDSP_DFT_SetupD
    private let analysis: [Float], synthesis: [Float], norm: [Float], paddedSamples: [Int]
    init(shape: [Int], segment: Int) throws {
        guard shape.count == 3, shape[0] % 2 == 0, shape[0] >= 4, shape[2] == 2, shape[1] == 2049, segment > 1 else {
            throw AutomixRuntimeError.invalid("Unexpected HTDemucs spectral shape")
        }
        n = 2 * (shape[1] - 1); hop = n / 4; frames = shape[0] / 2; self.segment = segment
        let pad = hop / 2 * 3, extra = (hop - segment % hop) % hop
        let innerLength = segment + 2 * pad + extra
        guard innerLength + n == (frames + 3) * hop else { throw AutomixRuntimeError.invalid("Invalid FFT frame count") }
        // Compute the two nested numpy-style reflect pads once per analysis request, not once per overlapping frame.
        func reflected(_ index: Int, length: Int) -> Int {
            let period = 2 * (length - 1), remainder = (index % period + period) % period
            return remainder < length ? remainder : period - remainder
        }
        let half = n / 2
        paddedSamples = (0..<((frames - 1) * hop + n)).map {
            reflected(reflected($0 - half, length: innerLength) - pad, length: segment)
        }
        guard let f = vDSP_DFT_zop_CreateSetupD(nil, vDSP_Length(n), .FORWARD) else {
            throw AutomixRuntimeError.invalid("Cannot create model FFT")
        }
        guard let i = vDSP_DFT_zop_CreateSetupD(nil, vDSP_Length(n), .INVERSE) else {
            vDSP_DFT_DestroySetupD(f)
            throw AutomixRuntimeError.invalid("Cannot create model inverse FFT")
        }
        forward = f; inverse = i
        let size = n
        let hann = (0..<size).map { 0.5 - 0.5 * cos(2 * .pi * Double($0) / Double(size)) }
        analysis = hann.map { Float($0 / sqrt(Double(size))) }
        synthesis = hann.map { Float($0 * sqrt(Double(size))) }
        var weight = [Double](repeating: 0, count: (frames + 3) * hop)
        for frame in 0..<frames { for j in 0..<n { weight[frame * hop + j] += hann[j] * hann[j] } }
        norm = weight[(n / 2)..<(n / 2 + hop * (frames - 1))].map(Float.init)
    }
    deinit { vDSP_DFT_DestroySetupD(forward); vDSP_DFT_DestroySetupD(inverse) }
    func encode(_ audio: [Float]) throws -> [Float] {
        guard audio.count == 2 * segment else { throw AutomixRuntimeError.invalid("Invalid FFT input") }
        let bins = n / 2 + 1
        var output = [Float](repeating: 0, count: 2 * frames * bins * 2)
        var padded = [Float](repeating: 0, count: paddedSamples.count), windowed = [Float](repeating: 0, count: n)
        var real = [Double](repeating: 0, count: n), imag = real, re = real, im = real
        output.withUnsafeMutableBufferPointer { out in
            analysis.withUnsafeBufferPointer { window in
                for channel in 0..<2 {
                    for j in paddedSamples.indices { padded[j] = audio[channel * segment + paddedSamples[j]] }
                    padded.withUnsafeBufferPointer { pcm in
                        for frame in 0..<frames {
                            // Keep float windowing before double FFT, matching the original NumPy rounding boundary.
                            vDSP_vmul(pcm.baseAddress! + frame * hop, 1, window.baseAddress!, 1, &windowed, 1, vDSP_Length(n))
                            vDSP_vspdp(&windowed, 1, &real, 1, vDSP_Length(n))
                            vDSP_DFT_ExecuteD(forward, &real, &imag, &re, &im)
                            let offset = (channel * frames + frame) * bins * 2
                            vDSP_vdpsp(&re, 1, out.baseAddress! + offset, 2, vDSP_Length(bins))
                            vDSP_vdpsp(&im, 1, out.baseAddress! + offset + 1, 2, vDSP_Length(bins))
                        }
                    }
                }
            }
        }
        return output
    }
    func decode(_ spectrum: [Float], time: [Float], channels: [Int] = Array(0..<8)) throws -> [Float] {
        try spectrum.withUnsafeBufferPointer { spectral in
            try time.withUnsafeBufferPointer { try decode(spectral, time: $0, channels: channels) }
        }
    }
    // Consume borrowed ORT tensors synchronously. Only reconstruct channels requested by the original JS contract.
    func decode(_ spectrum: UnsafeBufferPointer<Float>, time: UnsafeBufferPointer<Float>, channels: [Int]) throws -> [Float] {
        let bins = n / 2 + 1, length = (frames + 3) * hop
        guard time.count == 8 * segment, spectrum.count == 8 * frames * bins * 2,
              !channels.isEmpty, channels.allSatisfy({ (0..<8).contains($0) }) else {
            throw AutomixRuntimeError.invalid("Unexpected HTDemucs output shape")
        }
        var output = [Float](repeating: 0, count: channels.count * segment)
        var real = [Double](repeating: 0, count: n), imag = real, re = real, im = real
        var wave = [Float](repeating: 0, count: n), scaled = wave
        var scale = 1 / Double(n)
        let pad = hop / 2 * 3
        output.withUnsafeMutableBufferPointer { out in
            synthesis.withUnsafeBufferPointer { window in
                norm.withUnsafeBufferPointer { weight in
                    for (target, channel) in channels.enumerated() {
                        var ola = [Float](repeating: 0, count: length)
                        ola.withUnsafeMutableBufferPointer { accumulation in
                            for frame in 0..<frames {
                                let offset = (channel * frames + frame) * bins * 2
                                vDSP_vspdp(spectrum.baseAddress! + offset, 2, &real, 1, vDSP_Length(bins))
                                vDSP_vspdp(spectrum.baseAddress! + offset + 1, 2, &imag, 1, vDSP_Length(bins))
                                for bin in 1..<n / 2 { real[n - bin] = real[bin]; imag[n - bin] = -imag[bin] }
                                vDSP_DFT_ExecuteD(inverse, &real, &imag, &re, &im)
                                re.withUnsafeMutableBufferPointer { buffer in
                                    vDSP_vsmulD(buffer.baseAddress!, 1, &scale, buffer.baseAddress!, 1, vDSP_Length(n))
                                }
                                vDSP_vdpsp(&re, 1, &wave, 1, vDSP_Length(n))
                                // Separate float multiply/add preserves the Python overlap-add rounding order.
                                vDSP_vmul(&wave, 1, window.baseAddress!, 1, &scaled, 1, vDSP_Length(n))
                                let destination = accumulation.baseAddress! + frame * hop
                                vDSP_vadd(&scaled, 1, destination, 1, destination, 1, vDSP_Length(n))
                            }
                            let destination = out.baseAddress! + target * segment
                            vDSP_vdiv(weight.baseAddress! + pad, 1, accumulation.baseAddress! + n / 2 + pad, 1,
                                      destination, 1, vDSP_Length(segment))
                            vDSP_vadd(time.baseAddress! + channel * segment, 1, destination, 1, destination, 1, vDSP_Length(segment))
                        }
                    }
                }
            }
        }
        return output
    }
}

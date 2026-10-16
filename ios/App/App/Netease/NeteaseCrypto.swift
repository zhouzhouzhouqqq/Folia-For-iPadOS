import Foundation
import CryptoKit
import CommonCrypto
import Security
import zlib

// Protocol cryptography ported from API Enhanced 4.41.1 (MIT), using public Apple APIs.
enum NeteaseCrypto {
    static let eapiKey = Data("e82ckenh8dichen8".utf8)
    static let staticKey = Data(hex: "ab1d5a430f6bb04a3f01e81ddd72bd916d5ce591248ac128714806d7f8fb1b84")
    static let signKey = Data("mUHCwVNWJbunMqAHf5MImuirT6plvs6VSFW62MGHstFQxhBGdEoIhLItH3djc4+FB/OKty3+lL2rGeoFBpVe5g==".utf8)
    static func random(_ count: Int) throws -> Data {
        var bytes = Data(count: count)
        let status = bytes.withUnsafeMutableBytes { SecRandomCopyBytes(kSecRandomDefault, count, $0.baseAddress!) }
        guard status == errSecSuccess else { throw NeteaseError.message("Secure random generation failed") }
        return bytes
    }
    static func json(_ value: Any) throws -> Data { try JSONSerialization.data(withJSONObject: value, options: [.sortedKeys, .withoutEscapingSlashes]) }
    static func text(_ value: Any) -> String {
        if let string = value as? String { return string }
        if let number = value as? NSNumber {
            if CFGetTypeID(number) == CFBooleanGetTypeID() { return number.boolValue ? "true" : "false" }
            return number.stringValue
        }
        if value is NSNull { return "null" }
        if let bytes = try? json(value), let string = String(data: bytes, encoding: .utf8) { return string }
        return String(describing: value)
    }
    static func escape(_ value: String) -> String {
        value.utf8.map { byte -> String in
            switch byte {
            case 65...90, 97...122, 48...57, 42, 45, 46, 95: return String(UnicodeScalar(byte))
            case 32: return "+"
            default: return String(format: "%%%02X", byte)
            }
        }.joined()
    }
    static func form(_ value: [String: Any]) -> String {
        value.keys.sorted().map { escape($0) + "=" + escape(text(value[$0]!)) }.joined(separator: "&")
    }
    static func aes(_ input: Data, key: Data, iv: Data? = nil, decrypt: Bool = false) throws -> Data {
        var output = Data(count: input.count + kCCBlockSizeAES128)
        var written = 0
        let capacity = output.count
        let status = output.withUnsafeMutableBytes { out in
            input.withUnsafeBytes { source in
                key.withUnsafeBytes { keyBytes in
                    let perform: (UnsafeRawPointer?) -> CCCryptorStatus = { ivBytes in
                        CCCrypt(CCOperation(decrypt ? kCCDecrypt : kCCEncrypt), CCAlgorithm(kCCAlgorithmAES),
                            CCOptions(kCCOptionPKCS7Padding | (iv == nil ? kCCOptionECBMode : 0)),
                            keyBytes.baseAddress, key.count, ivBytes, source.baseAddress, input.count,
                            out.baseAddress, capacity, &written)
                    }
                    if let iv { return iv.withUnsafeBytes { perform($0.baseAddress) } }
                    return perform(nil)
                }
            }
        }
        guard status == kCCSuccess else { throw NeteaseError.message("Protocol AES operation failed (\(status))") }
        return output.prefix(written)
    }
    static func md5(_ input: Data) -> String { Insecure.MD5.hash(data: input).map { String(format: "%02x", $0) }.joined() }
    static func sign(timestamp: String, nonce: String) -> String {
        Data(HMAC<SHA256>.authenticationCode(for: Data((timestamp + nonce).utf8), using: SymmetricKey(data: signKey))).base64EncodedString()
    }
    static func weapi(_ data: [String: Any], secret suppliedSecret: Data? = nil) throws -> [String: String] {
        let alphabet = Array("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".utf8)
        let secret = try suppliedSecret ?? Data(random(16).map { alphabet[Int($0) % alphabet.count] })
        let iv = Data("0102030405060708".utf8)
        let first = try aes(json(data), key: Data("0CoJUm6Qyw8W8jud".utf8), iv: iv).base64EncodedString()
        let params = try aes(Data(first.utf8), key: secret, iv: iv).base64EncodedString()
        // SPKI public key from upstream; Security takes the embedded PKCS#1 key.
        let spki = Data(base64Encoded: "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDgtQn2JZ34ZC28NWYpAUd98iZ37BUrX/aKzmFbt7clFSs6sXqHauqKWqdtLkF2KexO40H1YTX8z2lSgBBOAxLsvaklV8k4cBFK9snQXE9/DDaFt6Rr7iVZMldczhC0JNgTz+SHXT6CBHuX3e9SdB1Ua44oncaTWz7OBGLbCiK45wIDAQAB")!
        var error: Unmanaged<CFError>?
        guard let key = SecKeyCreateWithData(spki.dropFirst(22) as CFData, [kSecAttrKeyType: kSecAttrKeyTypeRSA, kSecAttrKeyClass: kSecAttrKeyClassPublic] as CFDictionary, &error) else {
            throw NeteaseError.message("Protocol RSA key import failed")
        }
        let block = Data(repeating: 0, count: SecKeyGetBlockSize(key) - secret.count) + Data(secret.reversed())
        guard let encrypted = SecKeyCreateEncryptedData(key, .rsaEncryptionRaw, block as CFData, &error) as Data? else {
            throw NeteaseError.message("Protocol RSA encryption failed")
        }
        return ["params": params, "encSecKey": encrypted.hex]
    }
    static func eapi(uri: String, data: [String: Any]) throws -> [String: String] {
        let text = String(decoding: try json(data), as: UTF8.self)
        let digest = md5(Data("nobody\(uri)use\(text)md5forencrypt".utf8))
        return ["params": try aes(Data("\(uri)-36cd479b6b5-\(text)-36cd479b6b5-\(digest)".utf8), key: eapiKey).hex.uppercased()]
    }
    // X25519 + HMAC derivation + AES-GCM and the upstream nested AES envelope.
    static func xeapi(uri: String, data: [String: Any], keyState: [String: Any], sessionID: String, sessionKey: String) throws -> [String: String] {
        guard let publicText = keyState["publicKey"] as? String, let peerBytes = Data(base64Encoded: publicText), peerBytes.count == 32 else {
            throw NeteaseError.message("Invalid xeapi public key")
        }
        let ephemeral = Curve25519.KeyAgreement.PrivateKey()
        let ephemeralRaw = ephemeral.publicKey.rawRepresentation
        let shared = try ephemeral.sharedSecretFromKeyAgreement(with: Curve25519.KeyAgreement.PublicKey(rawRepresentation: peerBytes))
        let sharedData = shared.withUnsafeBytes { Data($0) }
        let prk = Data(HMAC<SHA256>.authenticationCode(for: sharedData, using: SymmetricKey(data: Data(repeating: 0, count: 32))))
        let aesKey = Data(HMAC<SHA256>.authenticationCode(for: ephemeralRaw + Data([1]), using: SymmetricKey(data: prk))).prefix(16)
        let dynamicKey = sessionKey.isEmpty ? try random(16) : Data(sessionKey.utf8)
        guard [16, 24, 32].contains(dynamicKey.count) else { throw NeteaseError.message("Invalid xeapi session key") }
        let sk = keyState["sk"] as? String ?? ""
        let seal = try AES.GCM.seal(Data("\(dynamicKey.base64EncodedString())|android|\(sk)".utf8), using: SymmetricKey(data: aesKey))
        let s = ephemeralRaw + Data(seal.nonce) + seal.ciphertext + seal.tag
        var fields = data; fields.removeValue(forKey: "e_r")
        let content = form(fields)
        let parts = uri.split(separator: "?", maxSplits: 1, omittingEmptySubsequences: false)
        var plain: [String: Any] = ["queryString": parts.count == 2 ? String(parts[1]) + "&e_r=true" : "e_r=true"]
        if !content.isEmpty { plain["content"] = content }
        let inner = try aes(json(plain), key: staticKey)
        let mask = try random(16)
        let xored = Data(inner.enumerated().map { $0.element ^ mask[$0.offset & 15] })
        let rotation = xored.isEmpty ? 0 : Int(mask[0] & 15) % xored.count
        let mixed = mask + xored.dropFirst(rotation) + xored.prefix(rotation)
        let c = try aes(mixed, key: dynamicKey)
        let version = text(keyState["version"] ?? "")
        let r = try aes(Data("\(version)|\(sessionKey.isEmpty ? "" : sessionID)".utf8), key: staticKey)
        return ["C": c.base64URL, "S": s.base64EncodedString(), "R": r.base64EncodedString()]
    }
    static func inflate(_ input: Data) throws -> Data {
        var stream = z_stream()
        guard inflateInit2_(&stream, 15 + 32, ZLIB_VERSION, Int32(MemoryLayout<z_stream>.size)) == Z_OK else {
            throw NeteaseError.message("Response decompressor initialization failed")
        }
        defer { inflateEnd(&stream) }
        var result = Data()
        try input.withUnsafeBytes { source in
            stream.next_in = UnsafeMutablePointer(mutating: source.bindMemory(to: Bytef.self).baseAddress)
            stream.avail_in = uInt(input.count)
            var status: Int32 = Z_OK
            repeat {
                var buffer = [UInt8](repeating: 0, count: 32_768)
                let count = buffer.count
                status = buffer.withUnsafeMutableBufferPointer { target in
                    stream.next_out = target.baseAddress; stream.avail_out = uInt(count)
                    return zlib.inflate(&stream, Z_NO_FLUSH)
                }
                guard status == Z_OK || status == Z_STREAM_END else { throw NeteaseError.message("Compressed response is invalid") }
                result.append(contentsOf: buffer.prefix(count - Int(stream.avail_out)))
                guard result.count <= 32 * 1024 * 1024 else { throw NeteaseError.message("Decompressed response exceeds limit") }
            } while status != Z_STREAM_END
        }
        return result
    }
}

enum NeteaseError: LocalizedError {
    case message(String)
    var errorDescription: String? { if case .message(let value) = self { return value }; return nil }
}

extension Data {
    init(hex: String) { self.init(stride(from: 0, to: hex.count, by: 2).map { index in
        let start = hex.index(hex.startIndex, offsetBy: index)
        return UInt8(hex[start..<hex.index(start, offsetBy: 2)], radix: 16)!
    }) }
    var hex: String { map { String(format: "%02x", $0) }.joined() }
    var base64URL: String { base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "") }
}

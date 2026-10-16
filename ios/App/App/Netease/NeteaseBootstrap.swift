import Foundation

// Same exchange-key and guest-session startup as the desktop backend; all state remains on this device.
extension NeteaseClient {
    func bootstrap() async throws {
        if state.keyState == nil || Date().timeIntervalSince1970 - state.keyFetchedAt > 86_400 {
            do { try await refreshExchangeKey() }
            catch {
                if state.keyState == nil { throw NeteaseError.message("NetEase key initialization failed: \(error.localizedDescription)") }
                bootstrapWarning = "Exchange key refresh failed; using the previously validated device cache."
            }
        }
        guard state.cookies["MUSIC_U"] == nil, state.cookies["MUSIC_A"] == nil else { return }
        let deviceID = state.deviceID
        let xorKey = Array("3go8&$8*3*3h0k(2)2".utf8)
        let xored = Data(deviceID.utf8.enumerated().map { $0.element ^ xorKey[$0.offset % xorKey.count] })
        let digest = Data(hex: NeteaseCrypto.md5(xored)).base64EncodedString()
        let username = Data("\(deviceID) \(digest)".utf8).base64EncodedString()
        do {
            let result = try await execute(uri: "/api/register/anonimous", data: ["username": username], mode: "xeapi", cookie: state.cookies)
            if let body = result["body"] as? [String: Any], Self.code(body) != 200 { bootstrapWarning = "Guest registration returned code \(Self.code(body)); login can still be attempted." }
        } catch { bootstrapWarning = "Guest registration failed; login can still be attempted." }
        try persist()
    }
    func refreshExchangeKey() async throws {
        let nonce = (0..<16).map { _ in String(Int.random(in: 0...9)) }.joined()
        let timestamp = Self.timestamp
        let previous = (try? exchangeKey()) ?? [:]
        let payload: [String: Any] = ["appVersion": "9.5.61", "currentKeyVersion": previous["version"] ?? "",
            "deviceId": state.deviceID, "nonce": nonce, "os": "android", "requestType": "active",
            "signature": NeteaseCrypto.sign(timestamp: timestamp, nonce: nonce), "t1": "", "t2": "", "timestamp": timestamp, "uid": ""]
        let response = try await transport.post(url: URL(string: "https://interface.music.163.com/api/bsr/sk/get")!,
            body: Data(NeteaseCrypto.form(payload).utf8), headers: ["User-Agent": Self.androidUA, "Cookie": "deviceId=" + state.deviceID])
        guard let body = try JSONSerialization.jsonObject(with: response.data) as? [String: Any], Self.code(body) == 200,
              let data = body["data"] as? [String: Any], let encrypted = data["encryptedData"] as? String,
              let signature = data["signature"] as? String else {
            throw NeteaseError.message("NetEase key endpoint returned HTTP \(response.response.statusCode) without a valid key envelope")
        }
        let responseTimestamp = NeteaseCrypto.text(data["timestamp"] ?? "")
        guard signature == NeteaseCrypto.sign(timestamp: responseTimestamp, nonce: nonce) else { throw NeteaseError.message("NetEase exchange key signature mismatch") }
        guard let sealed = Data(base64Encoded: encrypted), var key = try JSONSerialization.jsonObject(with: NeteaseCrypto.aes(sealed, key: NeteaseCrypto.staticKey, decrypt: true)) as? [String: Any] else {
            throw NeteaseError.message("NetEase exchange key is invalid")
        }
        if (key["sk"] as? String)?.isEmpty != false { key["sk"] = previous["sk"] }
        guard let sk = key["sk"] as? String, !sk.isEmpty, let raw = key["publicKey"] as? String,
              Data(base64Encoded: raw)?.count == 32 else { throw NeteaseError.message("NetEase exchange key is incomplete") }
        state.keyState = try NeteaseCrypto.json(key)
        state.keyFetchedAt = Date().timeIntervalSince1970
        state.xeapiSessionID = ""; state.xeapiSessionKey = ""
        try persist()
    }
}

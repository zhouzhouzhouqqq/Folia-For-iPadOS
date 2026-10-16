import Foundation

// Stateful equivalent of the desktop request layer; one actor serializes session/key updates.
actor NeteaseClient {
    let store: NeteaseStateStore
    let transport: NeteaseHTTPTransport
    var state: NeteaseSessionState
    var preparation: Task<Void, Error>?
    var anonymousAttempted = false
    var bootstrapWarning: String?
    static let desktopUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    static let androidUA = "NeteaseMusic/9.5.61.260802021928(9005061);Dalvik/2.1.0 (Linux; U; Android 12; HBN-AL00 Build/cd737a2.0)"
    init(store: NeteaseStateStore, transport: NeteaseHTTPTransport = NeteaseHTTP()) throws {
        self.store = store; self.transport = transport
        state = try store.load().map { try JSONDecoder().decode(NeteaseSessionState.self, from: $0) } ?? NeteaseSessionState()
    }
    func persist() throws { try store.save(JSONEncoder().encode(state)) }
    func status() -> [String: Any] {
        ["mode": "device-direct", "authenticated": state.cookies["MUSIC_U"] != nil,
         "anonymous": state.cookies["MUSIC_A"] != nil, "hasExchangeKey": state.keyState != nil,
         "bootstrapWarning": bootstrapWarning ?? ""]
    }
    func request(uri: String, data: [String: Any], options: [String: Any]) async throws -> [String: Any] {
        guard uri.count < 256, uri.range(of: "^/api/[A-Za-z0-9/_-]+$", options: .regularExpression) != nil,
              try NeteaseCrypto.json(data).count <= 1_048_576 else { throw NeteaseError.message("Unsupported NetEase request") }
        let mode = (options["crypto"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? "eapi"
        guard ["eapi", "weapi", "xeapi"].contains(mode) else { throw NeteaseError.message("NetEase protocol \(mode) needs a device adapter") }
        if let token = options["checkToken"] as? String, !token.isEmpty {
            throw NeteaseError.message("NetEase \(uri) requires the Watchman device adapter, which is not yet implemented")
        }
        try await prepare()
        var cookie = state.cookies
        // Explicit cookies are supplied only by this provider's existing per-backend namespace.
        if let value = options["cookie"] as? String { cookie.merge(Self.parseCookie(value)) { _, new in new } }
        if let value = options["cookie"] as? [String: Any] { cookie.merge(value.mapValues(NeteaseCrypto.text)) { _, new in new } }
        let isQR = uri == "/api/login/qrcode/unikey" || uri == "/api/login/qrcode/client/login"
        let result: [String: Any]
        do { result = try await execute(uri: uri, data: data, mode: mode, cookie: cookie) }
        catch let error as URLError where isQR && error.code != .cancelled {
            // Same one-retry policy as desktop. Never replay arbitrary mutations.
            try await Task.sleep(nanoseconds: 300_000_000)
            result = try await execute(uri: uri, data: data, mode: mode, cookie: cookie)
        }
        if uri == "/api/logout", let body = result["body"] as? [String: Any], Self.code(body) == 200 {
            let anonymous = state.cookies["MUSIC_A"]
            state.cookies = anonymous.map { ["MUSIC_A": $0] } ?? [:]
            state.xeapiSessionID = ""; state.xeapiSessionKey = ""
            try persist()
        }
        return result
    }
    func prepare() async throws {
        if let preparation { try await preparation.value; return }
        if anonymousAttempted { return }
        let task = Task { try await self.bootstrap() }
        preparation = task
        do { try await task.value; preparation = nil; anonymousAttempted = true }
        catch { preparation = nil; throw error }
    }
    func execute(uri: String, data: [String: Any], mode: String, cookie: [String: String]) async throws -> [String: Any] {
        var cookies = cookie
        let defaults: [String: String] = ["os": "pc", "osver": "Microsoft-Windows-10-Professional-build-19045-64bit",
            "appver": "3.1.17.204416", "channel": "netease", "deviceId": state.deviceID, "__remember_me": "true",
            "ntes_kaola_ad": "1", "WEVNSM": "1.0.0"]
        cookies.merge(defaults) { current, _ in current }
        if cookies["_ntes_nuid"] == nil { cookies["_ntes_nuid"] = try NeteaseCrypto.random(16).hex }
        if cookies["_ntes_nnid"] == nil { cookies["_ntes_nnid"] = cookies["_ntes_nuid"]! + "," + Self.timestamp }
        var payload = data; payload["e_r"] = false
        var headers = ["Cookie": Self.cookieHeader(cookies), "User-Agent": Self.desktopUA]
        let form: [String: String]
        let destination: String
        if mode == "weapi" {
            payload["csrf_token"] = cookies["__csrf"] ?? ""
            headers["Referer"] = "https://music.163.com"
            form = try NeteaseCrypto.weapi(payload)
            destination = "https://music.163.com/weapi/" + uri.dropFirst(5)
        } else if mode == "xeapi" {
            let key = try exchangeKey()
            cookies["os"] = "android"; cookies["osver"] = cookies["osver"] == defaults["osver"] ? "16" : cookies["osver"]
            cookies["appver"] = "9.5.61"; cookies["sDeviceId"] = cookies["deviceId"]
            cookies["buildver"] = String(Int(Date().timeIntervalSince1970))
            headers["Cookie"] = Self.cookieHeader(cookies)
            headers["User-Agent"] = Self.androidUA
            headers["X-Client-Enc-State"] = "ENCRYPTED"; headers["x-aeapi"] = "true"
            for (name, value) in ["x-deviceid": cookies["deviceId"], "x-os": "android", "x-osver": cookies["osver"],
                                  "x-appver": "9.5.61", "x-sdeviceid": cookies["deviceId"], "x-buildver": cookies["buildver"], "x-music-u": cookies["MUSIC_U"]] {
                if let value { headers[name] = value }
            }
            form = try NeteaseCrypto.xeapi(uri: uri, data: payload, keyState: key, sessionID: state.xeapiSessionID, sessionKey: state.xeapiSessionKey)
            destination = "https://interface3.music.163.com/xeapi/" + uri.dropFirst(5)
        } else {
            var header: [String: Any] = ["osver": cookies["osver"] ?? "", "deviceId": cookies["deviceId"] ?? "", "os": cookies["os"] ?? "pc",
                "appver": cookies["appver"] ?? "", "versioncode": "140", "mobilename": "", "buildver": String(Int(Date().timeIntervalSince1970)),
                "resolution": "1920x1080", "__csrf": cookies["__csrf"] ?? "", "channel": cookies["channel"] ?? "netease", "requestId": Self.timestamp + "_" + String(Int.random(in: 0...999))]
            for name in ["MUSIC_U", "MUSIC_A", "NMTID"] { if let value = cookies[name] { header[name] = value } }
            headers["Cookie"] = Self.cookieHeader(header.mapValues(NeteaseCrypto.text))
            payload["header"] = header
            form = try NeteaseCrypto.eapi(uri: uri, data: payload)
            destination = "https://interfacepc.music.163.com/eapi/" + uri.dropFirst(5)
        }
        let response = try await transport.post(url: URL(string: destination)!, body: Data(NeteaseCrypto.form(form).utf8), headers: headers)
        var bodyData = response.data
        if mode == "xeapi" {
            if let id = response.response.value(forHTTPHeaderField: "x-encr-ssid"), let key = response.response.value(forHTTPHeaderField: "x-encr-sskey") {
                state.xeapiSessionID = id; state.xeapiSessionKey = key
            }
            // Error responses can be ordinary JSON; encrypted success responses use eapi AES + optional gzip.
            if (try? JSONSerialization.jsonObject(with: bodyData)) == nil {
                bodyData = try NeteaseCrypto.aes(bodyData, key: NeteaseCrypto.eapiKey, decrypt: true)
                if bodyData.starts(with: [0x1f, 0x8b]) { bodyData = try NeteaseCrypto.inflate(bodyData) }
            }
        }
        guard var body = (try? JSONSerialization.jsonObject(with: bodyData)) as? [String: Any] else {
            throw NeteaseError.message("NetEase \(uri) returned HTTP \(response.response.statusCode) without a valid JSON object")
        }
        if let code = body["code"] { body["code"] = Int(NeteaseCrypto.text(code)) ?? code }
        var fields: [String: String] = [:]
        for (key, value) in response.response.allHeaderFields { fields[String(describing: key)] = String(describing: value) }
        let returned = HTTPCookie.cookies(withResponseHeaderFields: fields, for: URL(string: destination)!)
        var lines: [String] = []
        for cookie in returned {
            lines.append(cookie.name + "=" + cookie.value)
            if let expiry = cookie.expiresDate, expiry <= Date() { state.cookies.removeValue(forKey: cookie.name) }
            else { state.cookies[cookie.name] = cookie.value }
        }
        try persist()
        let code = Self.code(body)
        let special = [201, 302, 400, 502, 800, 801, 802, 803]
        let status = special.contains(code) ? 200 : ((100..<600).contains(code) ? code : response.response.statusCode)
        return ["status": status, "body": body, "cookie": lines]
    }
    func exchangeKey() throws -> [String: Any] {
        guard let data = state.keyState, let key = try JSONSerialization.jsonObject(with: data) as? [String: Any] else { throw NeteaseError.message("NetEase exchange key is not ready") }
        return key
    }
    static var timestamp: String { String(Int64(Date().timeIntervalSince1970 * 1000)) }
    static func code(_ body: [String: Any]) -> Int { Int(NeteaseCrypto.text(body["code"] ?? 0)) ?? 0 }
    static func parseCookie(_ value: String) -> [String: String] {
        var result: [String: String] = [:]
        for part in value.split(separator: ";") {
            let pair = part.split(separator: "=", maxSplits: 1, omittingEmptySubsequences: false)
            guard pair.count == 2 else { continue }
            let key = pair[0].trimmingCharacters(in: .whitespaces)
            if ["path", "domain", "expires", "max-age", "samesite"].contains(key.lowercased()) { continue }
            result[key] = String(pair[1]).trimmingCharacters(in: .whitespaces)
        }
        return result
    }
    static func cookieHeader(_ cookies: [String: String]) -> String {
        cookies.keys.sorted().map { NeteaseCrypto.escape($0).replacingOccurrences(of: "+", with: "%20") + "=" + NeteaseCrypto.escape(cookies[$0]!).replacingOccurrences(of: "+", with: "%20") }.joined(separator: "; ")
    }
}

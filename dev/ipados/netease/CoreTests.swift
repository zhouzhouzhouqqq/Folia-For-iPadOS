import Foundation

// Isolated native session/transport regression tests; never use a real account, Keychain, or upstream server.
final class TestStore: NeteaseStateStore {
    var bytes: Data?
    func load() throws -> Data? { bytes }
    func save(_ data: Data) throws { bytes = data }
    init() throws {
        var state = NeteaseSessionState()
        state.cookies = ["MUSIC_A": "test-guest"]
        state.keyState = try NeteaseCrypto.json(["version": 1, "sk": "test-only", "publicKey": Data(repeating: 7, count: 32).base64EncodedString()])
        state.keyFetchedAt = Date().timeIntervalSince1970
        bytes = try JSONEncoder().encode(state)
    }
}
actor FakeHTTP: NeteaseHTTPTransport {
    var calls: [(URL, [String: String])] = []
    var failures: Int
    let cookie: String?
    init(failures: Int = 0, cookie: String? = nil) { self.failures = failures; self.cookie = cookie }
    func post(url: URL, body: Data, headers: [String: String]) async throws -> NeteaseHTTPResponse {
        calls.append((url, headers))
        if failures > 0 { failures -= 1; throw URLError(.networkConnectionLost) }
        return NeteaseHTTPResponse(data: Data("{\"code\":200}".utf8), response: HTTPURLResponse(
            url: url, statusCode: 200, httpVersion: nil, headerFields: cookie.map { ["Set-Cookie": $0] })!)
    }
    func count() -> Int { calls.count }
    func lastCookie() -> String { calls.last?.1["Cookie"] ?? "" }
}
func require(_ condition: Bool, _ message: String) throws {
    if !condition { throw NeteaseError.message(message) }
}
@main struct CoreTests {
    static func main() async throws {
        let store = try TestStore()
        let loginHTTP = FakeHTTP(cookie: "MUSIC_U=test-auth; Path=/; Secure; HttpOnly; Max-Age=3600")
        let client = try NeteaseClient(store: store, transport: loginHTTP)
        _ = try await client.request(uri: "/api/login/qrcode/client/login", data: ["key": "test"], options: [:])
        try require(await client.status()["authenticated"] as? Bool == true, "Auth cookie not accepted")
        let restoredHTTP = FakeHTTP()
        let restored = try NeteaseClient(store: store, transport: restoredHTTP)
        try require(await restored.status()["authenticated"] as? Bool == true, "Session not restored from store")
        _ = try await restored.request(uri: "/api/user/account/get", data: [:], options: [:])
        try require(await restoredHTTP.lastCookie().contains("MUSIC_U=test-auth"), "Restored cookie not sent to upstream")
        _ = try await restored.request(uri: "/api/logout", data: [:], options: [:])
        let loggedOut = try NeteaseClient(store: store, transport: FakeHTTP())
        try require(await loggedOut.status()["authenticated"] as? Bool == false, "Logout did not clear persisted auth")
        try require(await loggedOut.status()["anonymous"] as? Bool == true, "Logout lost guest state")

        let expired = try NeteaseClient(store: TestStore(), transport: FakeHTTP(cookie: "MUSIC_U=; Path=/; Max-Age=0"))
        _ = try await expired.request(uri: "/api/login/qrcode/client/login", data: [:], options: [:])
        try require(await expired.status()["authenticated"] as? Bool == false, "Expired cookie remained authenticated")

        let qrHTTP = FakeHTTP(failures: 1)
        let retry = try NeteaseClient(store: TestStore(), transport: qrHTTP)
        _ = try await retry.request(uri: "/api/login/qrcode/unikey", data: [:], options: [:])
        try require(await qrHTTP.count() == 2, "QR transient failure must retry exactly once")
        let mutationHTTP = FakeHTTP(failures: 2)
        let mutation = try NeteaseClient(store: TestStore(), transport: mutationHTTP)
        do {
            _ = try await mutation.request(uri: "/api/playlist/manipulate/tracks", data: [:], options: [:])
            throw NeteaseError.message("Mutation unexpectedly succeeded")
        } catch is URLError {}
        try require(await mutationHTTP.count() == 1, "Mutation was replayed")

        let invalidHTTP = FakeHTTP()
        let invalid = try NeteaseClient(store: TestStore(), transport: invalidHTTP)
        for uri in ["https://other.invalid/api/login", "/api/../login", "/api/login?cookie=secret"] {
            var rejected = false
            do { _ = try await invalid.request(uri: uri, data: [:], options: [:]) } catch { rejected = true }
            try require(rejected, "Invalid path was accepted")
        }
        var rejectedWatchman = false
        do { _ = try await invalid.request(uri: "/api/playlist/subscribe", data: [:], options: ["checkToken": "v2"]) }
        catch { rejectedWatchman = true }
        let invalidCount = await invalidHTTP.count()
        try require(rejectedWatchman && invalidCount == 0, "Watchman operation was silently sent without token")

        let parallelHTTP = FakeHTTP()
        let parallel = try NeteaseClient(store: TestStore(), transport: parallelHTTP)
        async let a = parallel.request(uri: "/api/login/qrcode/unikey", data: [:], options: [:])
        async let b = parallel.request(uri: "/api/user/account/get", data: [:], options: [:])
        _ = try await (a, b)
        try require(await parallelHTTP.count() == 2, "Concurrent startup duplicated bootstrap")

        let http = NeteaseHTTP()
        for address in ["http://music.163.com/api/test", "https://other.invalid/api/test", "https://user:password@music.163.com/api/test"] {
            var rejected = false
            do { _ = try await http.post(url: URL(string: address)!, body: Data(), headers: [:]) } catch { rejected = true }
            try require(rejected, "Invalid HTTP destination was accepted")
        }
        var redirect: URLRequest? = URLRequest(url: URL(string: "https://other.invalid/")!)
        http.urlSession(URLSession.shared, task: URLSession.shared.dataTask(with: URL(string: "https://music.163.com/")!),
            willPerformHTTPRedirection: HTTPURLResponse(url: URL(string: "https://music.163.com/")!, statusCode: 302, httpVersion: nil, headerFields: nil)!,
            newRequest: redirect!) { redirect = $0 }
        try require(redirect == nil, "Redirect must not forward account headers")
        print("PASS: native cookie persistence/restoration/logout/expiry, QR-only retry, mutation non-replay, path/Watchman guards, concurrent preparation, HTTPS host allowlist and redirect rejection.")
    }
}

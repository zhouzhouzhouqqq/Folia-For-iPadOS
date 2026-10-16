import Foundation

// Native AI regression harness uses synthetic URLProtocol responses and memory credentials only; never contacts servers.
final class MemoryAIStore: AICredentialStore {
    var bytes: Data?
    func load() throws -> Data? { bytes }
    func save(_ data: Data) throws { bytes = data }
    func clear() throws { bytes = nil }
}
final class AIProtocol: URLProtocol {
    static var requests: [URLRequest] = []
    static var status = 200
    static var output = "{\"text\":\"synthetic-key\"}"
    static var headers: [String: String] = ["Content-Type": "application/json"]
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        Self.requests.append(request)
        let reply = HTTPURLResponse(url: request.url!, statusCode: Self.status, httpVersion: nil, headerFields: Self.headers)!
        client?.urlProtocol(self, didReceive: reply, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: Data(Self.output.utf8))
        client?.urlProtocolDidFinishLoading(self)
    }
    override func stopLoading() {}
}
func check(_ value: Bool, _ message: String) throws { if !value { throw AIError.message(message) } }
func mustFail(_ message: String, _ operation: () throws -> Void) throws {
    do { try operation() } catch { return }
    throw AIError.message(message)
}
@main struct CoreTests {
    static func main() async throws {
        for url in ["http://ai.example", "https://user:pass@ai.example", "https://ai.example?key=x", "https://ai.example/#key"] {
            try mustFail("insecure URL accepted") { _ = try AIConfiguration.endpoint(provider: "openai", raw: url) }
        }
        try check(try AIConfiguration.endpoint(provider: "openai", raw: "https://ai.example/v1/").absoluteString == "https://ai.example/v1/chat/completions", "URL normalization")
        let config = try AIConfiguration().replacing(provider: "openai", apiUrl: "https://ai.example/v1", model: "test-model", temperature: 0.7, stream: true, newKey: "synthetic-key")
        try check(config.metadata["apiKey"] == nil && config.metadata["hasKey"] as? Bool == true, "secret exposed in metadata")
        try check(!String(describing: config.metadata).contains("synthetic-key"), "secret exposed in metadata text")
        let reused = try config.replacing(provider: "openai", apiUrl: config.apiUrl, model: "other", temperature: 1, stream: false, newKey: "")
        try check(reused.apiKey == config.apiKey && reused.revision != config.revision, "key reuse or revision failed")
        try mustFail("key moved to another endpoint") { _ = try config.replacing(provider: "openai", apiUrl: "https://other.example/v1", model: "", temperature: 1, stream: false, newKey: "") }
        try mustFail("key moved to another provider") { _ = try config.replacing(provider: "gemini", apiUrl: "", model: "", temperature: 1, stream: false, newKey: "") }
        let storage = MemoryAIStore()
        let settings = URLSessionConfiguration.ephemeral
        settings.protocolClasses = [AIProtocol.self]; settings.httpShouldSetCookies = false
        let service = try AIService(store: storage, session: URLSession(configuration: settings))
        let saved = try await service.save(provider: "openai", apiUrl: "https://ai.example/v1", model: "test-model", temperature: 0.7, stream: true, apiKey: "synthetic-key")
        let revision = saved["revision"] as! String, endpoint = saved["apiUrl"] as! String
        let restored = try AIService(store: storage)
        let restoredSettings = await restored.settings()
        try check(restoredSettings["revision"] as? String == revision && restoredSettings["hasKey"] as? Bool == true, "restore failed")
        let reply = try await service.request(id: "success", revision: revision, url: endpoint, body: "{}", timeoutMs: 1000)
        try check(reply.status == 200 && !reply.body.contains("synthetic-key") && reply.body.contains("***"), "response redaction failed")
        let sent = AIProtocol.requests.last!
        try check(sent.value(forHTTPHeaderField: "Authorization") == "Bearer synthetic-key", "native authorization missing")
        try check(sent.value(forHTTPHeaderField: "Cookie") == nil && sent.httpMethod == "POST", "cookies sent")
        for (id, rev, url, body) in [("revision", "stale", endpoint, "{}"), ("foreign", revision, "https://other.example/v1", "{}"), ("json", revision, endpoint, "[]")] {
            do { _ = try await service.request(id: id, revision: rev, url: url, body: body, timeoutMs: 1000); throw AIError.message("invalid request accepted") }
            catch let error as AIError { if error.localizedDescription == "invalid request accepted" { throw error } }
        }
        try check(AIProtocol.requests.count == 1, "invalid request left device")
        await service.cancel(id: "early-cancel")
        do { _ = try await service.request(id: "early-cancel", revision: revision, url: endpoint, body: "{}", timeoutMs: 1000); throw AIError.message("early cancellation ignored") }
        catch is CancellationError {}
        AIProtocol.status = 302
        do { _ = try await service.request(id: "redirect", revision: revision, url: endpoint, body: "{}", timeoutMs: 1000); throw AIError.message("redirect accepted") }
        catch let error as AIError { try check(error.localizedDescription.contains("redirects are blocked"), "redirect error lost") }
        AIProtocol.status = 200; AIProtocol.headers["Content-Length"] = "4000001"
        do { _ = try await service.request(id: "large", revision: revision, url: endpoint, body: "{}", timeoutMs: 1000); throw AIError.message("oversize accepted") }
        catch let error as AIError { try check(error.localizedDescription.contains("too large"), "size cap missing") }
        var followed = true
        AIRedirectGuard().urlSession(URLSession.shared, task: URLSession.shared.dataTask(with: URL(string: endpoint)!),
            willPerformHTTPRedirection: HTTPURLResponse(url: URL(string: endpoint)!, statusCode: 302, httpVersion: nil, headerFields: nil)!,
            newRequest: URLRequest(url: URL(string: "https://other.example")!)) { followed = $0 != nil }
        try check(!followed, "credentials can follow a redirect")
        try await service.clear()
        try check(storage.bytes == nil, "clear did not remove key")
        let cleared = await service.settings()
        try check(cleared["hasKey"] as? Bool == false, "clear metadata stale")
        print("PASS: native AI HTTPS validation, endpoint-bound keys, metadata privacy, persistence, native authorization, redaction, revision, cancellation, redirect rejection and response limits (mock transport, no real Keychain/network).")
    }
}

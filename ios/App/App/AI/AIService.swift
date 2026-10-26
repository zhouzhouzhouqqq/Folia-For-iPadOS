import Foundation

// Native HTTPS transport uses only the stored endpoint/key, no cookies, redirects or renderer-supplied credentials.
final class AIRedirectGuard: NSObject, URLSessionTaskDelegate, @unchecked Sendable {
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse,
                    newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) {
        completionHandler(nil)
    }
}
struct AIHTTPReply { let status: Int; let contentType: String; let body: String }
actor AIService {
    private var config: AIConfiguration
    private let store: AICredentialStore
    private let session: URLSession
    private var cancelledBeforeStart: [String: Date] = [:]
    private var tasks: [String: Task<AIHTTPReply, Error>] = [:]
    init(store: AICredentialStore, session: URLSession? = nil) throws {
        self.store = store
        config = try store.load().map { try JSONDecoder().decode(AIConfiguration.self, from: $0) } ?? AIConfiguration()
        let settings = URLSessionConfiguration.ephemeral
        settings.httpCookieStorage = nil; settings.urlCredentialStorage = nil; settings.urlCache = nil
        settings.httpShouldSetCookies = false
        settings.timeoutIntervalForRequest = 120; settings.timeoutIntervalForResource = 125
        self.session = session ?? URLSession(configuration: settings)
    }
    func settings() -> [String: Any] { config.metadata }
    func save(provider: String, apiUrl: String, model: String, temperature: Double, stream: Bool, apiKey: String) throws -> [String: Any] {
        let next = try config.replacing(provider: provider, apiUrl: apiUrl, model: model,
            temperature: temperature, stream: stream, newKey: apiKey)
        try store.save(JSONEncoder().encode(next))
        tasks.values.forEach { $0.cancel() }; tasks.removeAll()
        config = next
        return next.metadata
    }
    func clear() throws {
        try store.clear()
        tasks.values.forEach { $0.cancel() }; tasks.removeAll()
        config = AIConfiguration()
    }
    func cancel(id: String) {
        guard !id.isEmpty, id.count <= 80 else { return }
        if let task = tasks[id] { task.cancel() }
        else {
            cancelledBeforeStart = cancelledBeforeStart.filter { $0.value > Date().addingTimeInterval(-130) }
            if cancelledBeforeStart.count < 64 { cancelledBeforeStart[id] = Date() }
        }
    }
    func request(id: String, revision: String, url: String, body: String, timeoutMs: Double, method: String = "POST") async throws -> AIHTTPReply {
        if cancelledBeforeStart.removeValue(forKey: id) != nil { throw CancellationError() }
        guard !id.isEmpty, id.count <= 80, tasks[id] == nil, tasks.count < 4 else { throw AIError.message("AI request already active or busy") }
        guard !config.apiKey.isEmpty, revision == config.revision, !revision.isEmpty else { throw AIError.message("AI settings changed or no key saved; retry after saving settings") }
        let expected = try config.permittedRequest(url: url, method: method)
        let data = body.data(using: .utf8) ?? Data()
        guard body.utf8.count <= 1_000_000,
              method == "GET" ? body.isEmpty : (try JSONSerialization.jsonObject(with: data)) is [String: Any] else {
            throw AIError.message("AI request does not match the saved endpoint or JSON contract")
        }
        let snapshot = config
        let session = self.session
        let task = Task<AIHTTPReply, Error> {
            var request = URLRequest(url: expected)
            request.httpMethod = method; request.httpBody = method == "POST" ? data : nil
            request.timeoutInterval = max(1, min(timeoutMs.isFinite ? timeoutMs / 1000 : 120, 120))
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            if snapshot.provider == "gemini" { request.setValue(snapshot.apiKey, forHTTPHeaderField: "x-goog-api-key") }
            else if expected.host?.lowercased() == "api.anthropic.com" {
                request.setValue(snapshot.apiKey, forHTTPHeaderField: "x-api-key")
                request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
            } else { request.setValue("Bearer \(snapshot.apiKey)", forHTTPHeaderField: "Authorization") }
            let (bytes, response) = try await session.bytes(for: request, delegate: AIRedirectGuard())
            guard let http = response as? HTTPURLResponse else { throw AIError.message("AI server returned no HTTP response") }
            guard !(300...399).contains(http.statusCode) else { throw AIError.message("AI redirects are blocked; enter the final HTTPS endpoint") }
            let limit = 4_000_000
            guard http.expectedContentLength <= limit else { throw AIError.message("AI response is too large") }
            var result = Data()
            for try await byte in bytes {
                try Task.checkCancellation()
                guard result.count < limit else { throw AIError.message("AI response is too large") }
                result.append(byte)
            }
            // Upstreams can echo authorization in both error and success bodies; never return the stored secret.
            let text = String(decoding: result, as: UTF8.self).replacingOccurrences(of: snapshot.apiKey, with: "***")
            return AIHTTPReply(status: http.statusCode, contentType: http.value(forHTTPHeaderField: "Content-Type") ?? "application/json", body: text)
        }
        tasks[id] = task
        defer { tasks.removeValue(forKey: id) }
        return try await task.value
    }
}

import Foundation

// Ephemeral, TLS-validated transport restricted to the upstream music hosts, without automatic cookie sharing.
struct NeteaseHTTPResponse {
    let data: Data
    let response: HTTPURLResponse
}
protocol NeteaseHTTPTransport {
    func post(url: URL, body: Data, headers: [String: String]) async throws -> NeteaseHTTPResponse
}
final class NeteaseHTTP: NSObject, NeteaseHTTPTransport, URLSessionTaskDelegate {
    static let hosts: Set<String> = ["music.163.com", "interface.music.163.com", "interfacepc.music.163.com", "interface3.music.163.com"]
    private lazy var session: URLSession = {
        let config = URLSessionConfiguration.ephemeral
        config.httpCookieStorage = nil
        config.httpShouldSetCookies = false
        config.urlCache = nil
        config.timeoutIntervalForRequest = 20
        config.timeoutIntervalForResource = 30
        return URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }()
    func post(url: URL, body: Data, headers: [String: String]) async throws -> NeteaseHTTPResponse {
        guard url.scheme == "https", let host = url.host, Self.hosts.contains(host), url.user == nil, url.password == nil,
              body.count <= 1_048_576 else { throw NeteaseError.message("NetEase request destination or size is invalid") }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = body
        request.httpShouldHandleCookies = false
        request.setValue("application/x-www-form-urlencoded;charset=utf-8", forHTTPHeaderField: "Content-Type")
        for (key, value) in headers { request.setValue(value, forHTTPHeaderField: key) }
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw NeteaseError.message("NetEase returned no HTTP response") }
        guard data.count <= 32 * 1024 * 1024 else { throw NeteaseError.message("NetEase response exceeds size limit") }
        return NeteaseHTTPResponse(data: data, response: http)
    }
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse,
                    newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) {
        // Redirects are not needed by these JSON endpoints. Do not forward auth headers to a redirect target.
        completionHandler(nil)
    }
}

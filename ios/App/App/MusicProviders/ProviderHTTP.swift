import Foundation

// Isolated cookie-free sessions; redirects are returned to the scoped JS cookie jar for validation.
final class ProviderHTTP: NSObject, URLSessionTaskDelegate {
    private lazy var session: URLSession = {
        let config = URLSessionConfiguration.ephemeral
        config.httpCookieStorage = nil
        config.httpShouldSetCookies = false
        config.urlCache = nil
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        config.timeoutIntervalForRequest = 25
        config.timeoutIntervalForResource = 30
        return URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }()
    func urlSession(_ session: URLSession, task: URLSessionTask,
                    willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest,
                    completionHandler: @escaping (URLRequest?) -> Void) { completionHandler(nil) }
    func request(provider: String, url raw: String, method: String, headers: [String: String], body: String?) async throws -> [String: Any] {
        guard let url = URL(string: raw), ProviderSecurity.permits(url, provider: provider),
              ["GET", "POST", "HEAD"].contains(method) else { throw ProviderSecurity.failure("Blocked provider URL or method") }
        var request = URLRequest(url: url)
        request.httpMethod = method
        for (key, value) in headers {
            guard !["host", "connection", "content-length", "transfer-encoding"].contains(key.lowercased()),
                  !value.contains("\r"), !value.contains("\n") else { throw ProviderSecurity.failure("Invalid provider header") }
            request.setValue(value, forHTTPHeaderField: key)
        }
        if method == "POST", let body {
            guard body.utf8.count <= 2 * 1024 * 1024 else { throw ProviderSecurity.failure("Provider request too large") }
            request.httpBody = body.data(using: .utf8)
        }
        // Incremental reading caps the in-memory response, including unexpectedly large error bodies.
        let (bytes, response) = try await session.bytes(for: request)
        guard let response = response as? HTTPURLResponse else { throw ProviderSecurity.failure("Missing HTTP response") }
        var data = Data()
        for try await byte in bytes {
            guard data.count < 8 * 1024 * 1024 else { throw ProviderSecurity.failure("Provider response too large") }
            data.append(byte)
        }
        var responseHeaders: [String: String] = [:]
        var cookieHeaders: [String: String] = [:]
        for (key, value) in response.allHeaderFields {
            let name = String(describing: key)
            responseHeaders[name.lowercased()] = String(describing: value)
            cookieHeaders[name.lowercased() == "set-cookie" ? "Set-Cookie" : name] = String(describing: value)
        }
        let cookies = HTTPCookie.cookies(withResponseHeaderFields: cookieHeaders, for: url).map { cookie -> [String: Any] in
            var record: [String: Any] = ["name": cookie.name, "value": cookie.value, "domain": cookie.domain, "path": cookie.path, "secure": cookie.isSecure]
            if let expiry = cookie.expiresDate { record["expires"] = expiry.timeIntervalSince1970 * 1000 }
            return record
        }
        return ["status": response.statusCode, "headers": responseHeaders, "bodyBase64": data.base64EncodedString(), "cookies": cookies]
    }
}

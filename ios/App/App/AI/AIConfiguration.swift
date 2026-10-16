import Foundation
import Security

// Installation-local AI credentials. Renderer gets metadata only; a saved key stays bound to its exact endpoint.
struct AIConfiguration: Codable {
    var provider = "openai"
    var apiUrl = "https://api.openai.com/v1/chat/completions"
    var model = ""
    var temperature = 0.7
    var stream = false
    var apiKey = ""
    var revision = ""

    static func endpoint(provider: String, raw: String) throws -> URL {
        if provider == "gemini" {
            return URL(string: "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent")!
        }
        guard provider == "openai" else { throw AIError.message("Unknown AI provider") }
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        let input = trimmed.isEmpty ? "https://api.openai.com/v1/chat/completions" : trimmed
        guard input.count <= 2048, var url = URLComponents(string: input), url.scheme?.lowercased() == "https",
              let host = url.host, !host.isEmpty, url.user == nil, url.password == nil,
              url.query == nil, url.fragment == nil else {
            throw AIError.message("AI URL must use HTTPS without credentials, query or fragment")
        }
        let path = url.path.replacingOccurrences(of: "/+$", with: "", options: .regularExpression)
        if path.isEmpty { url.path = "/v1/chat/completions" }
        else if path.range(of: #"/v\d+$"#, options: .regularExpression) != nil { url.path = path + "/chat/completions" }
        else { url.path = path }
        guard let result = url.url else { throw AIError.message("Invalid AI URL") }
        return result
    }
    var metadata: [String: Any] {
        ["provider": provider, "apiUrl": apiUrl, "model": model, "temperature": temperature,
         "stream": stream, "hasKey": !apiKey.isEmpty, "revision": revision]
    }
    func replacing(provider: String, apiUrl: String, model: String, temperature: Double,
                   stream: Bool, newKey: String) throws -> AIConfiguration {
        let url = try Self.endpoint(provider: provider, raw: apiUrl).absoluteString
        let key = newKey.trimmingCharacters(in: .whitespacesAndNewlines)
        guard key.count <= 1024, !key.contains("\n"), !key.contains("\r"), model.count <= 256,
              temperature.isFinite, (0...2).contains(temperature) else { throw AIError.message("Invalid AI settings") }
        guard !key.isEmpty || (self.provider == provider && self.apiUrl == url && !apiKey.isEmpty) else {
            throw AIError.message("Enter an API key for this endpoint; saved keys are never moved to another URL")
        }
        return AIConfiguration(provider: provider, apiUrl: url, model: model.trimmingCharacters(in: .whitespacesAndNewlines),
            temperature: temperature, stream: provider == "openai" && stream,
            apiKey: key.isEmpty ? apiKey : key, revision: UUID().uuidString)
    }
}
enum AIError: LocalizedError {
    case message(String)
    var errorDescription: String? { if case let .message(text) = self { return text }; return nil }
}
protocol AICredentialStore {
    func load() throws -> Data?
    func save(_ data: Data) throws
    func clear() throws
}
struct AIKeychainStore: AICredentialStore {
    private let account: String
    init() {
        let key = "folia.ai.installation"
        if let existing = UserDefaults.standard.string(forKey: key) { account = existing }
        else { account = UUID().uuidString; UserDefaults.standard.set(account, forKey: key) }
    }
    private var query: [String: Any] {
        [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: "Folia.AI.Direct.v1", kSecAttrAccount as String: account]
    }
    func load() throws -> Data? {
        var request = query
        request[kSecReturnData as String] = true
        request[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        let status = SecItemCopyMatching(request as CFDictionary, &result)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess else { throw AIError.message("AI Keychain read failed (\(status))") }
        return result as? Data
    }
    func save(_ data: Data) throws {
        let status = SecItemUpdate(query as CFDictionary, [kSecValueData as String: data] as CFDictionary)
        if status == errSecItemNotFound {
            var record = query
            record[kSecValueData as String] = data
            record[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
            let added = SecItemAdd(record as CFDictionary, nil)
            guard added == errSecSuccess else { throw AIError.message("AI Keychain save failed (\(added))") }
        } else if status != errSecSuccess { throw AIError.message("AI Keychain save failed (\(status))") }
    }
    func clear() throws {
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else { throw AIError.message("AI Keychain clear failed (\(status))") }
    }
}

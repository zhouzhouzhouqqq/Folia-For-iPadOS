import Foundation
import Security

// Provider-specific HTTPS boundary and installation-scoped Keychain records.
enum ProviderSecurity {
    static func valid(_ provider: String) -> Bool { ["qq", "kugou"].contains(provider) }
    static func permits(_ url: URL, provider: String) -> Bool {
        guard valid(provider), url.scheme == "https", url.user == nil, url.password == nil,
              url.port == nil || url.port == 443, let host = url.host?.lowercased() else { return false }
        let roots = provider == "qq" ? ["qq.com", "tencentmusic.com", "weixin.qq.com", "gtimg.cn", "qpic.cn"] : ["kugou.com", "kugou.net"]
        return roots.contains { host == $0 || host.hasSuffix("." + $0) }
    }
    static func query(_ provider: String) throws -> [String: Any] {
        guard valid(provider) else { throw failure("Unknown provider") }
        let key = "folia.musicProviders.installation.v1"
        let installation: String
        if let value = UserDefaults.standard.string(forKey: key) { installation = value }
        else { installation = UUID().uuidString; UserDefaults.standard.set(installation, forKey: key) }
        return [kSecClass as String: kSecClassGenericPassword,
                kSecAttrService as String: "Folia.MusicProviders.\(provider).v1",
                kSecAttrAccount as String: installation]
    }
    static func load(_ provider: String) throws -> String {
        var request = try query(provider)
        request[kSecReturnData as String] = true
        request[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        let status = SecItemCopyMatching(request as CFDictionary, &result)
        if status == errSecItemNotFound { return "{}" }
        guard status == errSecSuccess, let data = result as? Data, let value = String(data: data, encoding: .utf8)
        else { throw failure("Secure provider session cannot be read (\(status))") }
        return value
    }
    static func save(_ provider: String, value: String) throws {
        guard let data = value.data(using: .utf8), data.count <= 512 * 1024,
              (try JSONSerialization.jsonObject(with: data)) is [String: Any] else { throw failure("Invalid provider state") }
        let request = try query(provider)
        let status = SecItemUpdate(request as CFDictionary, [kSecValueData as String: data] as CFDictionary)
        if status == errSecItemNotFound {
            var record = request
            record[kSecValueData as String] = data
            record[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
            let added = SecItemAdd(record as CFDictionary, nil)
            guard added == errSecSuccess else { throw failure("Secure provider session cannot be saved (\(added))") }
        } else if status != errSecSuccess { throw failure("Secure provider session cannot be saved (\(status))") }
    }
    static func failure(_ message: String) -> NSError {
        NSError(domain: "FoliaMusicProviders", code: 1, userInfo: [NSLocalizedDescriptionKey: message])
    }
}

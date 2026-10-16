import Foundation
import Security

// One installation-scoped Keychain record; direct mode never sends credentials to a configurable proxy.
protocol NeteaseStateStore {
    func load() throws -> Data?
    func save(_ data: Data) throws
}
struct NeteaseKeychainStore: NeteaseStateStore {
    private let account: String
    init() {
        let key = "folia.netease.installation"
        if let existing = UserDefaults.standard.string(forKey: key) { account = existing }
        else { account = UUID().uuidString; UserDefaults.standard.set(account, forKey: key) }
    }
    private var query: [String: Any] { [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: "Folia.Netease.Direct.v1", kSecAttrAccount as String: account] }
    func load() throws -> Data? {
        var request = query
        request[kSecReturnData as String] = true
        request[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        let status = SecItemCopyMatching(request as CFDictionary, &result)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess else { throw NeteaseError.message("NetEase secure session could not be read (\(status))") }
        return result as? Data
    }
    func save(_ data: Data) throws {
        let update = [kSecValueData as String: data]
        let status = SecItemUpdate(query as CFDictionary, update as CFDictionary)
        if status == errSecItemNotFound {
            var record = query
            record[kSecValueData as String] = data
            record[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
            let added = SecItemAdd(record as CFDictionary, nil)
            guard added == errSecSuccess else { throw NeteaseError.message("NetEase secure session could not be saved (\(added))") }
        } else if status != errSecSuccess { throw NeteaseError.message("NetEase secure session could not be saved (\(status))") }
    }
}
struct NeteaseSessionState: Codable {
    var deviceID = String((UUID().uuidString + UUID().uuidString).replacingOccurrences(of: "-", with: "").prefix(52)).uppercased()
    var cookies: [String: String] = [:]
    var keyState: Data?
    var keyFetchedAt: TimeInterval = 0
    var xeapiSessionID = ""
    var xeapiSessionKey = ""
}

import Foundation
import CryptoKit
import FoliaAutomixRuntime

// Verified, atomically installed app-private models. No executable downloads or desktop runtime.
actor AutomixModelStore {
    private let root: URL
    private var verified = Set<String>()
    init(storageRoot: URL? = nil) throws {
        let directory = try storageRoot ?? FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask,
            appropriateFor: nil, create: true).appendingPathComponent("Folia/automix-models", isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        // iOS may expose /var via a system symlink; canonicalize the root before rejecting job links.
        root = directory.resolvingSymlinksInPath()
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        var url = root
        var values = URLResourceValues(); values.isExcludedFromBackup = true
        try url.setResourceValues(values)
    }
    func model(_ name: String) throws -> AutomixModel {
        guard let item = AutomixModel.all.first(where: { $0.name == name }) else { throw AutomixRuntimeError.invalid("Unknown AutoMix model") }
        return item
    }
    func verify(_ url: URL, model: AutomixModel) throws {
        guard try url.resourceValues(forKeys: [.isRegularFileKey, .isSymbolicLinkKey, .fileSizeKey]).isRegularFile == true,
              try url.resourceValues(forKeys: [.isSymbolicLinkKey]).isSymbolicLink != true,
              try url.resourceValues(forKeys: [.fileSizeKey]).fileSize == model.bytes else { throw AutomixRuntimeError.invalid("Model file size mismatch") }
        let file = try FileHandle(forReadingFrom: url)
        defer { try? file.close() }
        var hash = SHA256()
        while let data = try file.read(upToCount: 1024 * 1024), !data.isEmpty { hash.update(data: data) }
        guard hash.finalize().map({ String(format: "%02x", $0) }).joined() == model.sha256 else { throw AutomixRuntimeError.invalid("Model SHA-256 mismatch") }
    }
    func path(_ name: String) throws -> String {
        let item = try model(name), url = root.appendingPathComponent(item.file)
        if !verified.contains(name) { try verify(url, model: item); verified.insert(name) }
        return url.path
    }
    func status() -> [String: Bool] {
        var result: [String: Bool] = [:]
        for item in AutomixModel.all { result[item.name] = (try? path(item.name)) != nil }
        return result
    }
    func install(_ source: URL, name: String) throws {
        let item = try model(name)
        try verify(source, model: item)
        let stage = root.appendingPathComponent(UUID().uuidString + ".partial")
        defer { try? FileManager.default.removeItem(at: stage) }
        try FileManager.default.copyItem(at: source, to: stage)
        let target = root.appendingPathComponent(item.file)
        if FileManager.default.fileExists(atPath: target.path) { _ = try FileManager.default.replaceItemAt(target, withItemAt: stage) }
        else { try FileManager.default.moveItem(at: stage, to: target) }
        verified.insert(name)
    }
    func remove(_ name: String) throws {
        let item = try model(name), url = root.appendingPathComponent(item.file)
        if FileManager.default.fileExists(atPath: url.path) { try FileManager.default.removeItem(at: url) }
        verified.remove(name)
    }
}

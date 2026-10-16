import Foundation
import Testing
import FoliaAutomixRuntime

// Runs the actual app-private storage classes in an isolated temporary root; no device files or personal media.
@Suite(.serialized) struct NativeStorageTests {
    private func temporary() throws -> URL {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("folia-automix-test-" + UUID().uuidString)
        try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }
    @Test func tensorBoundsCleanupAndSymlinks() throws {
        let root = try temporary()
        defer { try? FileManager.default.removeItem(at: root) }
        let files = try AutomixFiles(storageRoot: root)
        let id = try files.create(), job = try files.job(id)
        #expect(throws: AutomixRuntimeError.self) { try files.job("../outside") }
        #expect(throws: AutomixRuntimeError.self) { try files.job(id.lowercased()) }
        let input = job.appendingPathComponent("input.f32"), samples: [Float] = [1, 2, 3]
        try samples.withUnsafeBytes { try Data($0).write(to: input) }
        let result = try files.read(id, count: 3)
        #expect(result == samples)
        #expect(throws: AutomixRuntimeError.self) { try files.read(id, count: 2) }
        #expect(throws: AutomixRuntimeError.self) { try files.read(id, count: -1) }
        let outside = root.appendingPathComponent("outside.f32")
        try FileManager.default.moveItem(at: input, to: outside)
        try FileManager.default.createSymbolicLink(at: input, withDestinationURL: outside)
        #expect(throws: AutomixRuntimeError.self) { try files.read(id, count: 3) }
        try files.remove(id)
        #expect(!FileManager.default.fileExists(atPath: job.path))
        #expect(FileManager.default.fileExists(atPath: outside.path))
    }
    @Test func systemAliasForRootIsAcceptedButJobAliasIsRejected() throws {
        let base = try temporary()
        defer { try? FileManager.default.removeItem(at: base) }
        let actual = base.appendingPathComponent("actual"), alias = base.appendingPathComponent("alias")
        try FileManager.default.createDirectory(at: actual, withIntermediateDirectories: true)
        try FileManager.default.createSymbolicLink(at: alias, withDestinationURL: actual)
        let files = try AutomixFiles(storageRoot: alias.appendingPathComponent("bridge"))
        let id = try files.create()
        let job = try files.job(id)
        #expect(FileManager.default.fileExists(atPath: job.path))
        let other = actual.appendingPathComponent("outside")
        try FileManager.default.moveItem(at: job, to: other)
        try FileManager.default.createSymbolicLink(at: job, withDestinationURL: other)
        #expect(throws: AutomixRuntimeError.self) { try files.job(id) }
    }
    @Test func corruptOrUnknownModelsNeverBecomeAvailable() async throws {
        let root = try temporary()
        defer { try? FileManager.default.removeItem(at: root) }
        let store = try AutomixModelStore(storageRoot: root)
        let empty = await store.status()
        #expect(empty == ["beat_this": false, "htdemucs": false])
        let bad = root.appendingPathComponent("bad.onnx")
        try Data([0]).write(to: bad)
        do { try await store.install(bad, name: "beat_this"); Issue.record("Accepted corrupt model") } catch {}
        do { _ = try await store.path("runtime"); Issue.record("Accepted desktop Python runtime") } catch {}
        let stillEmpty = await store.status()
        #expect(stillEmpty == empty)
    }
    @Test func verifiedModelInstallAndRestart() async throws {
        guard let source = ProcessInfo.processInfo.environment["FOLIA_AUTOMIX_TEST_MODELS"] else { return }
        let root = try temporary()
        defer { try? FileManager.default.removeItem(at: root) }
        let store = try AutomixModelStore(storageRoot: root)
        try await store.install(URL(fileURLWithPath: source + "/beat_this.onnx"), name: "beat_this")
        let installed = await store.status()
        #expect(installed == ["beat_this": true, "htdemucs": false])
        let reopened = try AutomixModelStore(storageRoot: root)
        let recovered = await reopened.status()
        #expect(recovered == installed)
        try await reopened.remove("beat_this")
        let removed = await reopened.status()
        #expect(removed == ["beat_this": false, "htdemucs": false])
    }
}

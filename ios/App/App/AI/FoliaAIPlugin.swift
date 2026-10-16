import Foundation
import Capacitor

// App-local AI settings/Keychain and cancellable HTTPS calls; prompts and parsing reuse Folia's original client.
@objc(FoliaAIPlugin)
public final class FoliaAIPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FoliaAIPlugin"
    public let jsName = "FoliaAI"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getSettings", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveSettings", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearSettings", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "request", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancel", returnType: CAPPluginReturnPromise)
    ]
    private var client: AIService?
    private func service() throws -> AIService {
        if let client { return client }
        let created = try AIService(store: AIKeychainStore())
        client = created
        return created
    }
    private func run(_ call: CAPPluginCall, operation: @escaping (AIService) async throws -> [String: Any]) {
        do {
            let client = try service()
            Task {
                do { call.resolve(try await operation(client)) }
                catch is CancellationError { call.reject("AI request cancelled", "AI_CANCELLED") }
                catch let error as URLError { call.reject(error.localizedDescription, error.code == .cancelled ? "AI_CANCELLED" : "AI_NETWORK") }
                catch { call.reject(error.localizedDescription, "AI_REQUEST") }
            }
        } catch { call.reject("AI secure settings could not be loaded", "AI_STORAGE") }
    }
    @objc func getSettings(_ call: CAPPluginCall) { run(call) { await $0.settings() } }
    @objc func saveSettings(_ call: CAPPluginCall) {
        run(call) { client in
            try await client.save(provider: call.getString("provider") ?? "openai", apiUrl: call.getString("apiUrl") ?? "",
                model: call.getString("model") ?? "", temperature: call.getDouble("temperature") ?? 0.7,
                stream: call.getBool("stream") ?? false, apiKey: call.getString("apiKey") ?? "")
        }
    }
    @objc func clearSettings(_ call: CAPPluginCall) { run(call) { try await $0.clear(); return [:] } }
    @objc func cancel(_ call: CAPPluginCall) { run(call) { await $0.cancel(id: call.getString("id") ?? ""); return [:] } }
    @objc func request(_ call: CAPPluginCall) {
        run(call) { client in
            let reply = try await client.request(id: call.getString("id") ?? "", revision: call.getString("revision") ?? "",
                url: call.getString("url") ?? "", body: call.getString("body") ?? "", timeoutMs: call.getDouble("timeoutMs") ?? 120_000)
            return ["status": reply.status, "contentType": reply.contentType, "body": reply.body]
        }
    }
}

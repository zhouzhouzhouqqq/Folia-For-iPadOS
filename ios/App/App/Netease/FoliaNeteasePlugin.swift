import Foundation
import Capacitor

// App-local direct provider bridge; it does not start a server or embed Node/Electron.
@objc(FoliaNeteasePlugin)
public final class FoliaNeteasePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FoliaNeteasePlugin"
    public let jsName = "FoliaNetease"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "request", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getState", returnType: CAPPluginReturnPromise)
    ]
    private var client: NeteaseClient?
    private func service() throws -> NeteaseClient {
        if let client { return client }
        let created = try NeteaseClient(store: NeteaseKeychainStore())
        client = created
        return created
    }
    @objc func request(_ call: CAPPluginCall) {
        guard let uri = call.getString("uri") else { call.reject("Missing NetEase request path"); return }
        do {
            let service = try service()
            let data = call.getObject("data") ?? [:]
            let options = call.getObject("options") ?? [:]
            Task {
                do { call.resolve(try await service.request(uri: uri, data: data, options: options)) }
                catch let error as URLError { call.reject("NetEase \(uri): \(error.localizedDescription)", "NETEASE_DIRECT_NETWORK") }
                catch { call.reject(error.localizedDescription, "NETEASE_DIRECT_REQUEST") }
            }
        } catch { call.reject(error.localizedDescription, "NETEASE_DIRECT_STORAGE") }
    }
    @objc func getState(_ call: CAPPluginCall) {
        do {
            let service = try service()
            Task { call.resolve(await service.status()) }
        } catch { call.reject(error.localizedDescription, "NETEASE_DIRECT_STORAGE") }
    }
}

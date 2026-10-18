import Foundation
import Capacitor

// Native IO and secure persistence only. The existing provider adapters own login and playback state.
@objc(FoliaMusicProvidersPlugin)
public final class FoliaMusicProvidersPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FoliaMusicProvidersPlugin"
    public let jsName = "FoliaMusicProviders"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "request", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "loadState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveState", returnType: CAPPluginReturnPromise)
    ]
    private let http = ProviderHTTP()
    @objc func request(_ call: CAPPluginCall) {
        guard let provider = call.getString("provider"), let url = call.getString("url") else { call.reject("Missing provider request"); return }
        let headers = (call.getObject("headers") ?? [:]).compactMapValues { $0 as? String }
        let method = call.getString("method") ?? "GET"
        let body = call.getString("body")
        Task {
            do { call.resolve(try await http.request(provider: provider, url: url, method: method, headers: headers, body: body)) }
            // NSError may carry a credential-bearing URL; expose only the transport error code.
            catch { call.reject("Provider HTTPS request failed (\((error as NSError).code))", "PROVIDER_NETWORK") }
        }
    }
    @objc func loadState(_ call: CAPPluginCall) {
        guard let provider = call.getString("provider") else { call.reject("Missing provider"); return }
        do { call.resolve(["value": try ProviderSecurity.load(provider)]) }
        catch { call.reject(error.localizedDescription, "PROVIDER_STORAGE") }
    }
    @objc func saveState(_ call: CAPPluginCall) {
        guard let provider = call.getString("provider"), let value = call.getString("value") else { call.reject("Missing provider state"); return }
        do { try ProviderSecurity.save(provider, value: value); call.resolve() }
        catch { call.reject(error.localizedDescription, "PROVIDER_STORAGE") }
    }
}

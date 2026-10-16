import Foundation
import Capacitor
import UIKit
import UniformTypeIdentifiers

// Model management and inference only; the two existing Web Audio decks remain the sole audio engine.
@objc(FoliaAutomixPlugin)
public final class FoliaAutomixPlugin: CAPPlugin, CAPBridgedPlugin, UIDocumentPickerDelegate {
    public let identifier = "FoliaAutomixPlugin"
    public let jsName = "FoliaAutomix"
    public let pluginMethods: [CAPPluginMethod] = ["status", "createJob", "cleanJob", "infer", "downloadModel", "removeModel", "importModel", "cancel"].map {
        CAPPluginMethod(name: $0, returnType: CAPPluginReturnPromise)
    }
    private var engine: AutomixEngine?
    private var pickerCall: CAPPluginCall?
    private var observers: [NSObjectProtocol] = []
    public override func load() {
        for event in [UIApplication.didEnterBackgroundNotification, UIApplication.didBecomeActiveNotification, UIApplication.didReceiveMemoryWarningNotification] {
            observers.append(NotificationCenter.default.addObserver(forName: event, object: nil, queue: .main) { [weak self] _ in
                guard let engine = self?.engine else { return }
                Task {
                    if event == UIApplication.didReceiveMemoryWarningNotification { await engine.cancel() }
                    else { await engine.setForeground(event == UIApplication.didBecomeActiveNotification) }
                }
            })
        }
    }
    deinit { for observer in observers { NotificationCenter.default.removeObserver(observer) } }
    private func service() throws -> AutomixEngine {
        if let engine { return engine }
        let created = try AutomixEngine(foreground: UIApplication.shared.applicationState != .background); engine = created
        return created
    }
    private func run(_ call: CAPPluginCall, action: @escaping (AutomixEngine) async throws -> [String: Any]) {
        do { let engine = try service(); Task {
            do { call.resolve(try await action(engine)) }
            catch is CancellationError { call.reject("AutoMix operation cancelled", "AUTOMIX_CANCELLED") }
            catch { call.reject(error.localizedDescription, "AUTOMIX_ERROR") }
        } } catch { call.reject("AutoMix storage unavailable", "AUTOMIX_STORAGE") }
    }
    @objc func status(_ call: CAPPluginCall) { run(call) { ["present": await $0.status(), "runtime": "onnxruntime-1.24.2-cpu"] } }
    @objc func createJob(_ call: CAPPluginCall) { run(call) { ["id": try await $0.create()] } }
    @objc func cleanJob(_ call: CAPPluginCall) { run(call) { try await $0.clean(call.getString("id") ?? ""); return [:] } }
    @objc func cancel(_ call: CAPPluginCall) { run(call) { await $0.cancel(); return [:] } }
    @objc func removeModel(_ call: CAPPluginCall) { run(call) { try await $0.remove(call.getString("name") ?? ""); return [:] } }
    @objc func infer(_ call: CAPPluginCall) {
        run(call) { engine in ["path": try await engine.infer(id: call.getString("id") ?? "", kind: call.getString("kind") ?? "",
            frames: call.getArray("frames", Int.self) ?? [], samples: call.getInt("samples") ?? 0)] }
    }
    @objc func downloadModel(_ call: CAPPluginCall) {
        let name = call.getString("name") ?? ""
        run(call) { [weak self] engine in
            try await engine.fetch(name) { fraction in
                DispatchQueue.main.async { self?.notifyListeners("modelProgress", data: ["name": name, "fraction": fraction]) }
            }
            return [:]
        }
    }
    @objc func importModel(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            guard self.pickerCall == nil else { call.reject("A model picker is already open"); return }
            guard AutomixModel.all.contains(where: { $0.name == call.getString("name") }) else { call.reject("Unknown model"); return }
            self.pickerCall = call
            let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.data], asCopy: false)
            picker.allowsMultipleSelection = false; picker.delegate = self
            self.bridge?.viewController?.present(picker, animated: true)
        }
    }
    public func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        pickerCall?.resolve(["cancelled": true]); pickerCall = nil
    }
    public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let call = pickerCall, let url = urls.first else { return }; pickerCall = nil
        let name = call.getString("name") ?? ""
        run(call) { engine in
            let access = url.startAccessingSecurityScopedResource()
            defer { if access { url.stopAccessingSecurityScopedResource() } }
            try await engine.install(url, name: name)
            return ["cancelled": false]
        }
    }
}

import Capacitor

// Registers the app-local Capacitor plugin without replacing the Web Audio player.
final class FoliaBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(FoliaDevicePlugin())
        bridge?.registerPluginInstance(FoliaNeteasePlugin())
        bridge?.registerPluginInstance(FoliaMusicProvidersPlugin())
        bridge?.registerPluginInstance(FoliaAIPlugin())
        bridge?.registerPluginInstance(FoliaAutomixPlugin())
    }
}

import Capacitor
import UIKit

// Registers the app-local Capacitor plugin without replacing the Web Audio player.
final class FoliaBridgeViewController: CAPBridgeViewController {
#if DEBUG
    private var playbackDiagnosticTimer: Timer?
    private var playbackDiagnosticSamples: [[String: Any]] = []
#endif
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(FoliaDevicePlugin())
        bridge?.registerPluginInstance(FoliaNeteasePlugin())
        bridge?.registerPluginInstance(FoliaMusicProvidersPlugin())
        bridge?.registerPluginInstance(FoliaAIPlugin())
        bridge?.registerPluginInstance(FoliaAutomixPlugin())
#if DEBUG
        if #available(iOS 16.4, *) { webView?.isInspectable = true }
        // Numeric resource counts only: no titles, URLs, cookies, tokens or file contents.
        playbackDiagnosticTimer = Timer.scheduledTimer(withTimeInterval: 3, repeats: true) { [weak self] _ in
            self?.capturePlaybackResources()
        }
#endif
    }

#if DEBUG
    private func capturePlaybackResources() {
        guard UIApplication.shared.applicationState == .active else { return }
        webView?.evaluateJavaScript("""
        (() => {
            const canvases = [...document.querySelectorAll('canvas')];
            const images = [...document.images];
            return { width: innerWidth, height: innerHeight, dpr: devicePixelRatio,
                nodes: document.getElementsByTagName('*').length,
                canvases: canvases.length,
                canvasPixels: canvases.reduce((n, c) => n + c.width * c.height, 0),
                largestCanvasPixels: Math.max(0, ...canvases.map(c => c.width * c.height)),
                images: images.length,
                imagePixels: images.reduce((n, i) => n + i.naturalWidth * i.naturalHeight, 0),
                largestImagePixels: Math.max(0, ...images.map(i => i.naturalWidth * i.naturalHeight)),
                audio: [...document.querySelectorAll('audio')].map(a => ({
                    paused: a.paused, ready: a.readyState, time: a.currentTime, error: a.error?.code ?? 0
                })), session: navigator.audioSession?.state ?? 'unavailable' };
        })()
        """) { [weak self] value, _ in
            guard let self, var sample = value as? [String: Any] else { return }
            sample["time"] = Date().timeIntervalSince1970
            self.playbackDiagnosticSamples.append(sample)
            self.playbackDiagnosticSamples = Array(self.playbackDiagnosticSamples.suffix(40))
            let url = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
                .appendingPathComponent("folia-playback-resources.json")
            if let data = try? JSONSerialization.data(withJSONObject: self.playbackDiagnosticSamples) {
                try? data.write(to: url, options: .atomic)
            }
        }
    }

    deinit { playbackDiagnosticTimer?.invalidate() }
#endif
}

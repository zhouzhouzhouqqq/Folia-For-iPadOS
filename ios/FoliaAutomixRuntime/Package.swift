// swift-tools-version: 5.9
import PackageDescription

// Native model runtime only; Folia's existing web audio graph remains the sole player.
let package = Package(name: "FoliaAutomixRuntime", platforms: [.iOS(.v15), .macOS(.v14)],
    products: [.library(name: "FoliaAutomixRuntime", targets: ["FoliaAutomixRuntime"])],
    targets: [
        .binaryTarget(name: "onnxruntime", url: "https://download.onnxruntime.ai/pod-archive-onnxruntime-c-1.24.2.zip",
            checksum: "f7100a992d2a8135168c8afd831e6a58b465349101982aa58b3e11d36e600b54"),
        .target(name: "FoliaORTC", dependencies: ["onnxruntime"], linkerSettings: [.linkedFramework("Foundation")]),
        .target(name: "FoliaAutomixRuntime", dependencies: ["FoliaORTC"], resources: [.copy("Resources/ORT-LICENSE")], linkerSettings: [.linkedFramework("Accelerate")]),
        .testTarget(name: "FoliaAutomixRuntimeTests", dependencies: ["FoliaAutomixRuntime"])
    ], cxxLanguageStandard: .cxx17)

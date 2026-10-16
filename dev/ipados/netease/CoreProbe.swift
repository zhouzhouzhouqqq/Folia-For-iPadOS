import Foundation

// Runs the exact platform-independent Swift provider core on macOS without reading the user's Keychain.
final class ProbeStore: NeteaseStateStore {
    var bytes: Data?
    func load() throws -> Data? { bytes }
    func save(_ data: Data) throws { bytes = data }
}
@main struct CoreProbe {
    static func main() async throws {
        let arguments = CommandLine.arguments
        if arguments.contains("--live") {
            let client = try NeteaseClient(store: ProbeStore())
            let qr = try await client.request(uri: "/api/login/qrcode/unikey", data: ["type": 3], options: [:])
            let body = qr["body"] as? [String: Any] ?? [:]
            let key = body["unikey"] as? String ?? ""
            let state = await client.status()
            let search = try await client.request(uri: "/api/cloudsearch/pc", data: ["s": "Folia", "type": 1, "limit": 1, "offset": 0, "total": true], options: [:])
            let searchBody = search["body"] as? [String: Any] ?? [:]
            let songs = (searchBody["result"] as? [String: Any])?["songs"] as? [[String: Any]] ?? []
            guard let songID = songs.first?["id"] else { throw NeteaseError.message("Live search returned no track") }
            let id = NeteaseCrypto.text(songID)
            let detail = try await client.request(uri: "/api/v3/song/detail", data: ["c": "[{\"id\":\(id)}]"], options: ["crypto": "weapi"])
            let lyric = try await client.request(uri: "/api/song/lyric/v1", data: ["id": id, "cp": false, "tv": 0, "lv": 0, "rv": 0, "kv": 0, "yv": 0, "ytv": 0, "yrv": 0], options: [:])
            let audio = try await client.request(uri: "/api/song/enhance/player/url/v1", data: ["ids": "[\(id)]", "level": "standard", "encodeType": "flac"], options: ["crypto": "xeapi"])
            let audioBody = audio["body"] as? [String: Any] ?? [:]
            let audioItem = (audioBody["data"] as? [[String: Any]])?.first ?? [:]
            let codes = ["qrCode": NeteaseClient.code(body), "searchCode": NeteaseClient.code(searchBody),
                "detailCode": NeteaseClient.code(detail["body"] as? [String: Any] ?? [:]),
                "lyricCode": NeteaseClient.code(lyric["body"] as? [String: Any] ?? [:]), "audioCode": NeteaseClient.code(audioBody)]
            var report: [String: Any] = codes
            report["hasQrKey"] = !key.isEmpty; report["state"] = state
            report["hasAudioURL"] = (audioItem["url"] as? String)?.isEmpty == false
            report["audioItemCode"] = audioItem["code"] ?? NSNull()
            print(String(decoding: try NeteaseCrypto.json(report), as: UTF8.self))
            guard !key.isEmpty, codes.values.allSatisfy({ $0 == 200 }) else { throw NeteaseError.message("Live upstream endpoint returned an error; inspect redacted report") }
            return
        }
        guard arguments.count == 2 else { throw NeteaseError.message("Expected fixture JSON path or --live") }
        let input = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: arguments[1]))) as! [String: Any]
        let data = input["data"] as! [String: Any]
        let key = input["keyState"] as! [String: Any]
        let eapi = try NeteaseCrypto.eapi(uri: "/api/test/native", data: data)
        let weapi = try NeteaseCrypto.weapi(data, secret: Data("0123456789abcdef".utf8))
        let xeapi = try NeteaseCrypto.xeapi(uri: "/api/test/native", data: data, keyState: key, sessionID: "", sessionKey: "")
        let compressed = Data(base64Encoded: input["gzip"] as! String)!
        let inflated = try NeteaseCrypto.inflate(compressed)
        print(String(decoding: try NeteaseCrypto.json(["eapi": eapi, "weapi": weapi, "xeapi": xeapi,
            "inflated": String(decoding: inflated, as: UTF8.self), "form": NeteaseCrypto.form(data)]), as: UTF8.self))
    }
}

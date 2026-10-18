import Foundation

// Anonymous opt-in protocol probe: use the same bounded native HTTPS implementation as the iOS plugin.
@main struct ProviderHTTPProbe {
    static func main() async {
        do {
            let data = FileHandle.standardInput.readDataToEndOfFile()
            guard let input = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let provider = input["provider"] as? String, let url = input["url"] as? String else { exit(2) }
            let output = try await ProviderHTTP().request(provider: provider, url: url,
                method: input["method"] as? String ?? "GET", headers: input["headers"] as? [String: String] ?? [:], body: input["body"] as? String)
            FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: output))
        } catch {
            // Never echo request URLs, response bodies or credentials to the shell.
            FileHandle.standardError.write(Data("Native HTTPS probe failed (\((error as NSError).code))\n".utf8))
            exit(1)
        }
    }
}

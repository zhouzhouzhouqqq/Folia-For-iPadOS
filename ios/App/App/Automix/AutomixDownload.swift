import Foundation

// Bounded disk download with byte progress; no public URL or response bodies are logged.
final class AutomixDownload: NSObject, URLSessionDownloadDelegate, @unchecked Sendable {
    private let lock = NSLock()
    private var task: URLSessionDownloadTask?
    private var session: URLSession?
    private var completion: CheckedContinuation<URL, Error>?
    private var result: Result<URL, Error>?
    private var cancelled = false
    private let expected: Int64
    private let progress: (Double) -> Void
    init(expected: Int, progress: @escaping (Double) -> Void) { self.expected = Int64(expected); self.progress = progress }
    func start(_ url: URL) async throws -> URL {
        try await withCheckedThrowingContinuation { continuation in
            lock.lock(); defer { lock.unlock() }
            guard !cancelled else { continuation.resume(throwing: CancellationError()); return }
            completion = continuation
            let config = URLSessionConfiguration.ephemeral
            config.timeoutIntervalForRequest = 60; config.timeoutIntervalForResource = 900
            config.httpCookieStorage = nil; config.urlCache = nil
            let client = URLSession(configuration: config, delegate: self, delegateQueue: nil)
            session = client
            let job = client.downloadTask(with: url); task = job; job.resume()
        }
    }
    func cancel() { lock.lock(); cancelled = true; let job = task; lock.unlock(); job?.cancel() }
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse,
                    newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) {
        completionHandler(request.url?.scheme == "https" ? request : nil)
    }
    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didWriteData bytesWritten: Int64,
                    totalBytesWritten: Int64, totalBytesExpectedToWrite: Int64) {
        if totalBytesWritten > expected { downloadTask.cancel(); return }
        progress(min(1, Double(totalBytesWritten) / Double(expected)))
    }
    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
        do {
            guard let response = downloadTask.response as? HTTPURLResponse, response.statusCode == 200 else { throw URLError(.badServerResponse) }
            let temp = FileManager.default.temporaryDirectory.appendingPathComponent("folia-model-" + UUID().uuidString)
            try FileManager.default.moveItem(at: location, to: temp)
            lock.lock(); result = .success(temp); lock.unlock()
        } catch { lock.lock(); result = .failure(error); lock.unlock() }
    }
    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        lock.lock()
        let callback = completion, reply = result ?? .failure(error ?? URLError(.unknown))
        completion = nil; self.task = nil; self.session = nil
        lock.unlock()
        session.finishTasksAndInvalidate()
        callback?.resume(with: reply)
    }
}

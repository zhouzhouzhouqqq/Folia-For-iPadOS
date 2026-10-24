import Foundation
import ImageIO
import UniformTypeIdentifiers

// System-media artwork is bounded in decoded pixels, independently of the visualizer's cover.
enum FoliaArtwork {
    static let maximumDimension = 512

    /// ImageIO downsamples at decode time, including EXIF rotation and animated-image first frames.
    static func thumbnail(_ data: Data) -> CGImage? {
        guard !data.isEmpty, data.count <= 4_000_000,
              let source = CGImageSourceCreateWithData(data as CFData,
                  [kCGImageSourceShouldCache: false] as CFDictionary) else { return nil }
        return CGImageSourceCreateThumbnailAtIndex(source, 0, [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceThumbnailMaxPixelSize: maximumDimension,
            kCGImageSourceShouldCacheImmediately: true
        ] as CFDictionary)
    }

    static func jpeg(_ data: Data) -> Data? {
        guard let image = thumbnail(data) else { return nil }
        let result = NSMutableData()
        guard let destination = CGImageDestinationCreateWithData(result,
            UTType.jpeg.identifier as CFString, 1, nil) else { return nil }
        CGImageDestinationAddImage(destination, image,
            [kCGImageDestinationLossyCompressionQuality: 0.85] as CFDictionary)
        guard CGImageDestinationFinalize(destination) else { return nil }
        return result as Data
    }
}

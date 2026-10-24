import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

// Compile with FoliaArtwork.swift against the macOS SDK; the iOS build verifies UIKit integration.
func require(_ condition: @autoclosure () -> Bool, _ message: String) {
    guard condition() else { fatalError(message) }
}

let context = CGContext(data: nil, width: 4096, height: 2048, bitsPerComponent: 8,
    bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
context.setFillColor(CGColor(red: 0.3, green: 0.6, blue: 0.9, alpha: 1))
context.fill(CGRect(x: 0, y: 0, width: 4096, height: 2048))
let image = context.makeImage()!
let encoded = NSMutableData()
let destination = CGImageDestinationCreateWithData(encoded, UTType.jpeg.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(destination, image, [kCGImagePropertyOrientation: 6] as CFDictionary)
require(CGImageDestinationFinalize(destination), "Fixture encoding failed")
require(encoded.length < 4_000_000, "Fixture must exercise compressed-byte versus pixel limits")
let thumbnail = FoliaArtwork.thumbnail(encoded as Data)!
require(thumbnail.width == 256 && thumbnail.height == 512, "Thumbnail must bound pixels and apply orientation")
let jpeg = FoliaArtwork.jpeg(encoded as Data)!
let decoded = CGImageSourceCreateWithData(jpeg as CFData, nil)!
let properties = CGImageSourceCopyPropertiesAtIndex(decoded, 0, nil)! as NSDictionary
require(properties[kCGImagePropertyPixelWidth] as? Int == 256, "Output width changed")
require(properties[kCGImagePropertyPixelHeight] as? Int == 512, "Output height changed")
require(FoliaArtwork.thumbnail(Data("not an image".utf8)) == nil, "Invalid image must fail")
require(FoliaArtwork.thumbnail(Data(repeating: 0, count: 4_000_001)) == nil, "Oversized input must fail")
print("PASS: bounded 4096×2048 image decode, EXIF rotation, JPEG output and invalid input")

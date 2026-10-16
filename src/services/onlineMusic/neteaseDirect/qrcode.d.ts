// Local declaration for the existing QR encoder's browser entry.
declare module 'qrcode' {
    const QRCode: { toDataURL(value: string): Promise<string> };
    export default QRCode;
}

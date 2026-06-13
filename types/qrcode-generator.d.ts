declare module "qrcode-generator" {
  type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

  interface QRCode {
    addData(data: string): void;
    make(): void;
    createSvgTag(opts?: { cellSize?: number; margin?: number; scalable?: boolean }): string;
  }

  function qrcode(typeNumber: number, errorCorrectionLevel: ErrorCorrectionLevel): QRCode;

  export = qrcode;
}

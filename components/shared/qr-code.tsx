import qrcode from "qrcode-generator";

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

/** Renders `value` as a scalable SVG QR code, generated synchronously at render time. */
export function QrCode({ value, size = 128, className }: QrCodeProps) {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  const svg = qr.createSvgTag({ scalable: true });

  return (
    <div
      style={{ width: size, height: size }}
      className={className}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

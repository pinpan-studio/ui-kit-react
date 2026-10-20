import { forwardRef, useImperativeHandle, useMemo } from 'react';
import { encodeCode128, encodeQr, qrSvgPath, type QrEcc } from '../../lib/qrCode';
import { MaterialIcon } from '../ui/MaterialIcon';
import './qr-code.scss';
import './barcode.scss';

export interface QrCodeHandle {
  toSvg: () => string;
  toPng: (px?: number) => Promise<string>;
}

/** app-qr-code : QR SVG généré localement (L/M/Q/H), couleurs, logo / icône central, export PNG / SVG. */
export const QrCode = forwardRef<
  QrCodeHandle,
  {
    value: string;
    size?: number;
    ecc?: QrEcc;
    color?: string;
    background?: string;
    quiet?: number;
    rounded?: boolean;
    logo?: string | null;
    icon?: string | null;
    caption?: string;
  }
>(function QrCode(
  {
    value,
    size = 160,
    ecc = 'M',
    color = '#0f172a',
    background = '#ffffff',
    quiet = 4,
    rounded = true,
    logo = null,
    icon = null,
    caption = '',
  },
  ref,
) {
  const matrix = useMemo(() => {
    try {
      return encodeQr(value, logo || icon ? 'H' : ecc);
    } catch {
      return null;
    }
  }, [value, logo, icon, ecc]);
  const path = useMemo(() => qrSvgPath(matrix ?? [], quiet), [matrix, quiet]);
  const n = matrix?.length ?? 21;
  const s = Math.round(n * 0.22);
  const box = { x: quiet + (n - s) / 2, s };
  const toSvg = () => {
    const t = (matrix?.length ?? 0) + quiet * 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${background}"/><path d="${path}" fill="${color}"/></svg>`;
  };
  useImperativeHandle(ref, () => ({
    toSvg,
    toPng: (px = 512) => {
      const img = new Image();
      const url = URL.createObjectURL(new Blob([toSvg()], { type: 'image/svg+xml' }));
      return new Promise<string>((resolve) => {
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = c.height = px;
          const g = c.getContext('2d');
          if (g) {
            g.imageSmoothingEnabled = false;
            g.drawImage(img, 0, 0, px, px);
          }
          URL.revokeObjectURL(url);
          resolve(c.toDataURL('image/png'));
        };
        img.src = url;
      });
    },
  }));
  const vb = n + quiet * 2;
  return (
    <span className="app-qr-code">
      {matrix ? (
        <div className="qr-box">
          <svg
            viewBox={`0 0 ${vb} ${vb}`}
            width={size}
            height={size}
            shapeRendering="crispEdges"
            role="img"
            aria-label={`QR code : ${value}`}
          >
            <rect width="100%" height="100%" fill={background} rx={rounded ? 2 : 0} />
            <path d={path} fill={color} />
            {(logo || icon) && <rect x={box.x} y={box.x} width={box.s} height={box.s} fill={background} rx="1.2" />}
            {logo && <image href={logo} x={box.x + 0.6} y={box.x + 0.6} width={box.s - 1.2} height={box.s - 1.2} />}
          </svg>
          {icon && !logo && <MaterialIcon name={icon} className="qr-icon" style={{ color, fontSize: size * 0.13 }} />}
        </div>
      ) : (
        <div className="qr-error" style={{ width: size, height: size }}>
          Texte trop long
        </div>
      )}
      {caption && <span className="qr-caption">{caption}</span>}
    </span>
  );
});

/** app-barcode : Code 128 en SVG (jeu B, ou C pour les numériques), texte lisible dessous. */
export function Barcode({
  value,
  height = 56,
  moduleWidth = 2,
  color = '#0f172a',
  background = '#ffffff',
  showText = true,
}: {
  value: string;
  height?: number;
  moduleWidth?: number;
  color?: string;
  background?: string;
  showText?: boolean;
}) {
  const bars = useMemo(() => {
    let widths: number[];
    try {
      widths = encodeCode128(value);
    } catch {
      return null;
    }
    const rects: [number, number][] = [];
    let x = 10;
    widths.forEach((w, i) => {
      if (i % 2 === 0) rects.push([x, w]);
      x += w;
    });
    return { rects, width: x + 10 };
  }, [value]);
  return (
    <span className="app-barcode">
      {bars ? (
        <>
          <svg
            viewBox={`0 0 ${bars.width} ${height}`}
            width={bars.width * moduleWidth}
            height={height}
            preserveAspectRatio="none"
            shapeRendering="crispEdges"
            role="img"
            aria-label={`Code-barres : ${value}`}
          >
            <rect width={bars.width} height={height} fill={background} />
            {bars.rects.map((r, i) => (
              <rect key={i} x={r[0]} y="0" width={r[1]} height={height} fill={color} />
            ))}
          </svg>
          {showText && <span className="bc-text">{value}</span>}
        </>
      ) : (
        <span className="bc-error">Valeur non encodable</span>
      )}
    </span>
  );
}

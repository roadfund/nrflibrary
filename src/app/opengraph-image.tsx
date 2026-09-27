import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: '#1e3a6e',
        color: 'white',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ fontSize: 28, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.7 }}>
        National Road Fund of Liberia
      </div>
      <div style={{ marginTop: 24, fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>
        National Road Fund Research Library
      </div>
      <div style={{ marginTop: 24, fontSize: 32, opacity: 0.85, maxWidth: 900 }}>
        Road, transport, and infrastructure data for Liberia.
      </div>
    </div>,
    { ...size },
  );
}

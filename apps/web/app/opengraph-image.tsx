import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PROTOCOLS = ['HTTP', 'DNS', 'TCP', 'TLS', 'NTP'];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#0d0d0d',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            backgroundImage:
              'linear-gradient(#2c2c2a 1px, transparent 1px), linear-gradient(90deg, #2c2c2a 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            opacity: 0.4,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#0ca30c',
              boxShadow: '0 0 0 8px rgba(12,163,12,0.18)',
            }}
          />
          <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, color: '#ffffff' }}>
            NetPulse
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 28,
            fontSize: 30,
            color: '#c3c2b7',
            maxWidth: 880,
          }}
        >
          Monitorización de red e infraestructura en tiempo real
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 48 }}>
          {PROTOCOLS.map((protocol) => (
            <div
              key={protocol}
              style={{
                display: 'flex',
                padding: '10px 20px',
                borderRadius: 999,
                border: '1px solid #383835',
                color: '#3987e5',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              {protocol}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}

import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PROTOCOLS = ['HTTP', 'DNS', 'TCP', 'TLS', 'NTP'];

// Colores literales (no tokens CSS): esto se rasteriza en el servidor, fuera
// del documento, asi que aqui no hay variables que resolver.
const PLANE = '#05060d';
const ACCENT = '#7c9bff';
const ACCENT_GRADIENT = 'linear-gradient(120deg, #22d3ee, #7c9bff 55%, #b18cff)';
const INK = '#f3f5fb';
const MUTED = '#8a90ae';
const LINE = 'rgba(255,255,255,0.08)';

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
          background: PLANE,
          fontFamily: 'monospace',
        }}
      >
        {/* Rejilla de fondo, como la del panel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            backgroundImage: `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)`,
            backgroundSize: '44px 44px',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: ACCENT_GRADIENT,
              boxShadow: `0 0 24px ${ACCENT}`,
            }}
          />
          <div style={{ display: 'flex', fontSize: 44, fontWeight: 700, color: ACCENT }}>
            NetPulse
          </div>
          <div style={{ display: 'flex', fontSize: 26, color: MUTED }}>
            {'// monitor de red'}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 30,
            fontSize: 34,
            color: INK,
            maxWidth: 900,
            lineHeight: 1.3,
          }}
        >
          Monitorización de red e infraestructura en tiempo real
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 44 }}>
          {PROTOCOLS.map((protocol) => (
            <div
              key={protocol}
              style={{
                display: 'flex',
                padding: '10px 22px',
                borderRadius: 4,
                border: `1px solid ${LINE}`,
                color: ACCENT,
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: 2,
              }}
            >
              {protocol}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', marginTop: 40, fontSize: 20, color: MUTED }}>
          uptime · latencia · incidentes · certificados TLS · desfase NTP
        </div>
      </div>
    ),
    { ...size },
  );
}

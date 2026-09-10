import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#05060d',
          borderRadius: 6,
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #22d3ee, #7c9bff 55%, #b18cff)',
            boxShadow: '0 0 0 4px rgba(124,155,255,0.28)',
          }}
        />
      </div>
    ),
    { ...size },
  );
}

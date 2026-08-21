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
          background: '#050805',
          borderRadius: 6,
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#3df62d',
            boxShadow: '0 0 0 4px rgba(61,246,45,0.35)',
          }}
        />
      </div>
    ),
    { ...size },
  );
}

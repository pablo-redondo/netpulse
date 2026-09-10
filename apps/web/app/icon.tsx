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
          background: '#050b07',
          borderRadius: 6,
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 13,
            height: 13,
            borderRadius: '50%',
            background: '#39ff6a',
            boxShadow: '0 0 10px 3px rgba(57,255,106,0.55)',
          }}
        />
      </div>
    ),
    { ...size },
  );
}

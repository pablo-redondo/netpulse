import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NETPULSE_API_URL ?? 'http://localhost:3001';

// El backend no es publico (NETPULSE_API_URL no lleva el prefijo NEXT_PUBLIC_),
// asi que el navegador no puede pedirle el CSV directamente: este route
// handler hace de proxy server-side y reenvia la respuesta tal cual.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const hours = request.nextUrl.searchParams.get('hours');
  const url = new URL(`${API_URL}/services/${id}/history.csv`);
  if (hours) url.searchParams.set('hours', hours);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: 'No se pudo exportar el histórico' },
      { status: response.status },
    );
  }

  return new NextResponse(response.body, {
    status: 200,
    headers: {
      'Content-Type': response.headers.get('Content-Type') ?? 'text/csv',
      'Content-Disposition':
        response.headers.get('Content-Disposition') ?? 'attachment; filename="history.csv"',
    },
  });
}

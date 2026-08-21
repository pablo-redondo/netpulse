import type { Metadata } from 'next';
import Link from 'next/link';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { CrtToggle } from '@/components/crt-toggle';
import { NavLink } from '@/components/nav-link';

// Cara mono para toda la interfaz: es un panel de maquina, y sus cifras ya
// son tabulares. next/font la auto-hospeda en el build, asi que el navegador
// no pide nada a Google en tiempo de ejecucion.
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

// URL de producción actual, necesaria para que Next.js resuelva las URLs
// absolutas de las imágenes Open Graph/Twitter. Si el dominio cambia, se
// actualiza aquí.
const SITE_URL = 'https://netpulse-web-tan.vercel.app';
const DESCRIPTION =
  'Monitorización de red e infraestructura en tiempo real: HTTP, DNS, TCP, TLS y NTP, con incidentes, alertas y una vista de topología.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'NetPulse',
  description: DESCRIPTION,
  openGraph: {
    title: 'NetPulse',
    description: DESCRIPTION,
    siteName: 'NetPulse',
    type: 'website',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NetPulse',
    description: DESCRIPTION,
  },
};

// Aplica la preferencia de efectos CRT antes del primer paint, para que no
// haya un parpadeo de scanlines en quien las tiene desactivadas.
const CRT_INIT = `
try {
  var c = localStorage.getItem('netpulse-crt');
  if (c === 'off') document.documentElement.dataset.crt = 'off';
} catch (e) {}
`;

const NAV = [
  { href: '/', label: 'dashboard' },
  { href: '/topology', label: 'topología' },
  { href: '/status', label: 'estado' },
];

export default function RootLayout({ children }: LayoutProps<'/'>) {
  // suppressHydrationWarning: el script inline escribe data-crt antes de
  // hidratar, asi que ese atributo diverge a proposito del HTML servido.
  return (
    <html
      lang="es"
      className={`${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: CRT_INIT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-40 border-b border-hairline bg-plane/85 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="flex items-center justify-between gap-4 pt-4">
              <Link href="/" className="group flex items-center gap-2.5">
                {/* Punto de "señal viva": el pulso es decorativo y se detiene
                    con prefers-reduced-motion. */}
                <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                  <span
                    aria-hidden
                    className="pulse-ring absolute h-2.5 w-2.5 rounded-full"
                    style={{ background: 'var(--accent)' }}
                  />
                  <span
                    aria-hidden
                    className="relative h-2.5 w-2.5 rounded-full"
                    style={{
                      background: 'var(--accent)',
                      boxShadow: '0 0 10px var(--accent)',
                    }}
                  />
                </span>
                <span className="glow text-base font-bold tracking-tight text-accent">
                  NetPulse
                </span>
                <span className="hidden text-xs text-text-muted sm:inline">
                  {'// monitor de red'}
                </span>
              </Link>

              <CrtToggle />
            </div>

            <nav className="mt-3 flex items-center gap-5 border-b border-transparent">
              {NAV.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} />
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>

        <footer className="border-t border-hairline">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-4 text-xs text-text-muted">
            <span>
              <span className="text-accent">$</span> sondas HTTP · DNS · TCP · TLS · NTP
            </span>
            <span>NestJS + Prisma + PostgreSQL · Next.js</span>
          </div>
        </footer>
      </body>
    </html>
  );
}

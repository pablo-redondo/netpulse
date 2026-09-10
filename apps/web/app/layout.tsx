import type { Metadata } from 'next';
import Link from 'next/link';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { EffectsToggle } from '@/components/effects-toggle';
import { NavLink } from '@/components/nav-link';

// Sans para la voz general de la interfaz; mono queda reservado a cifras y
// timestamps (clase `.tabular`), donde las tabulares importan. Ambas se
// auto-hospedan en el build vía next/font, sin peticiones a Google en runtime.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
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

// Aplica la preferencia de efectos antes del primer paint, para que no haya
// un parpadeo del aurora animado en quien lo tiene desactivado.
const FX_INIT = `
try {
  var f = localStorage.getItem('netpulse-fx');
  if (f === 'off') document.documentElement.dataset.fx = 'off';
} catch (e) {}
`;

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/topology', label: 'Topología' },
  { href: '/status', label: 'Estado' },
];

export default function RootLayout({ children }: LayoutProps<'/'>) {
  // suppressHydrationWarning: el script inline escribe data-fx antes de
  // hidratar, asi que ese atributo diverge a proposito del HTML servido.
  return (
    <html
      lang="es"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: FX_INIT }} />
      </head>
      <body className="flex min-h-full flex-col">
        {/* Fondo fijo, detrás de todo: rejilla tenue + tres manchas de
            gradiente a la deriva, visibles a través del cristal de los paneles. */}
        <div className="aurora-field" aria-hidden>
          <div className="aurora-blob aurora-blob-1" />
          <div className="aurora-blob aurora-blob-2" />
          <div className="aurora-blob aurora-blob-3" />
        </div>

        <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6">
          <div className="glass-header mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-3">
            <Link href="/" className="group flex items-center gap-2.5">
              {/* Punto de "señal viva": el pulso es decorativo y se detiene
                  con prefers-reduced-motion o con los efectos apagados. */}
              <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                <span
                  aria-hidden
                  className="pulse-ring absolute h-2.5 w-2.5 rounded-full"
                  style={{ background: 'var(--accent-2)' }}
                />
                <span
                  aria-hidden
                  className="relative h-2.5 w-2.5 rounded-full"
                  style={{
                    background: 'var(--accent-2)',
                    boxShadow: '0 0 10px var(--accent-2)',
                  }}
                />
              </span>
              <span className="text-gradient text-base font-bold tracking-tight">NetPulse</span>
              <span className="hidden text-xs text-text-muted sm:inline">
                monitor de red en tiempo real
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <nav className="flex items-center gap-1">
                {NAV.map((item) => (
                  <NavLink key={item.href} href={item.href} label={item.label} />
                ))}
              </nav>
              <EffectsToggle />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>

        <footer className="px-4 pb-6 sm:px-6">
          <div className="glass mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 rounded-2xl px-5 py-3.5 text-xs text-text-muted">
            <span>
              <span className="text-gradient font-medium">●</span> sondas HTTP · DNS · TCP · TLS ·
              NTP
            </span>
            <span>NestJS + Prisma + PostgreSQL · Next.js</span>
          </div>
        </footer>
      </body>
    </html>
  );
}

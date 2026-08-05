import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { ThemeToggle } from '@/components/theme-toggle';

export const metadata: Metadata = {
  title: 'NetPulse',
  description: 'Dashboard de monitorización de red e infraestructura',
};

// Aplica el tema guardado antes del primer paint para evitar el flash.
const THEME_INIT = `
try {
  var t = localStorage.getItem('netpulse-theme');
  if (t) document.documentElement.dataset.theme = t;
} catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<'/'>) {
  // suppressHydrationWarning: el script inline escribe data-theme antes de
  // hidratar, asi que ese atributo diverge a proposito del HTML servido.
  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <header className="border-b border-hairline">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-base font-semibold text-text-primary">
                NetPulse
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/" className="text-text-secondary hover:text-text-primary">
                  Dashboard
                </Link>
                <Link href="/topology" className="text-text-secondary hover:text-text-primary">
                  Topología
                </Link>
              </nav>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>

        <footer className="border-t border-hairline">
          <div className="mx-auto w-full max-w-6xl px-6 py-4 text-xs text-text-muted">
            Monitoriza servicios públicos mediante comprobaciones HTTP, DNS y TCP.
          </div>
        </footer>
      </body>
    </html>
  );
}

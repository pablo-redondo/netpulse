'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Pestaña de navegación tipo "pill" de cristal. El activo no se marca solo
 * con color: lleva además un fondo propio y `aria-current`, así que se lee
 * igual sin distinguir tonos.
 */
export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={
        active
          ? 'relative rounded-full px-3.5 py-1.5 text-sm font-medium text-text-primary transition-colors'
          : 'relative rounded-full px-3.5 py-1.5 text-sm text-text-muted transition-colors hover:text-text-secondary'
      }
    >
      {active && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-strong)',
            boxShadow: '0 0 0 1px rgba(124,155,255,0.15), 0 4px 18px -6px rgba(124,155,255,0.35)',
          }}
        />
      )}
      <span className="relative">{label}</span>
    </Link>
  );
}

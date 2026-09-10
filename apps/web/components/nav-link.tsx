'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Pestaña de navegación tipo prompt: el activo lleva un "▸" propio y una
 * regla inferior en fósforo, así que se lee igual sin distinguir tonos.
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
          ? 'relative -mb-px border-b-2 border-accent px-1 pb-2 text-sm font-medium text-text-primary'
          : 'relative -mb-px border-b-2 border-transparent px-1 pb-2 text-sm text-text-muted transition-colors hover:text-text-secondary'
      }
    >
      <span aria-hidden className={active ? 'text-accent' : 'text-transparent'}>
        ▸
      </span>{' '}
      {label}
    </Link>
  );
}

import Link from 'next/link';

export const RANGES = [
  { hours: 24, label: '24 h' },
  { hours: 168, label: '7 d' },
  { hours: 720, label: '30 d' },
] as const;

export function parseRange(value: string | undefined): number {
  const parsed = Number(value);
  return RANGES.some((range) => range.hours === parsed) ? parsed : 24;
}

/**
 * Fila única de filtro, por encima de todo lo que escopa: cada stat, gráfica
 * y tabla de la página se recalcula contra la misma ventana. El
 * seleccionado lleva además `aria-current`, no solo un fondo distinto.
 */
export function RangeFilter({ basePath, hours }: { basePath: string; hours: number }) {
  return (
    <div className="inline-flex items-center gap-1 rounded border border-hairline p-0.5">
      {RANGES.map((range) => {
        const selected = range.hours === hours;
        return (
          <Link
            key={range.hours}
            href={`${basePath}?hours=${range.hours}`}
            aria-current={selected ? 'true' : undefined}
            className={
              selected
                ? 'rounded-sm px-3 py-1 text-xs font-medium'
                : 'rounded-sm px-3 py-1 text-xs text-text-muted transition-colors hover:text-text-secondary'
            }
            style={
              selected
                ? { background: 'var(--surface-2)', color: 'var(--accent)' }
                : undefined
            }
          >
            {range.label}
          </Link>
        );
      })}
    </div>
  );
}

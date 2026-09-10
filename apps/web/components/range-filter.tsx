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
 * y tabla de la página se recalcula contra la misma ventana. Se presenta como
 * un control segmentado de cristal; el seleccionado lleva además
 * `aria-current`, no solo un fondo distinto.
 */
export function RangeFilter({ basePath, hours }: { basePath: string; hours: number }) {
  return (
    <div className="glass inline-flex items-center gap-1 rounded-full p-1">
      {RANGES.map((range) => {
        const selected = range.hours === hours;
        return (
          <Link
            key={range.hours}
            href={`${basePath}?hours=${range.hours}`}
            aria-current={selected ? 'true' : undefined}
            className={
              selected
                ? 'rounded-full px-3 py-1 text-xs font-medium text-text-primary transition-all'
                : 'rounded-full px-3 py-1 text-xs text-text-muted transition-all hover:text-text-secondary'
            }
            style={
              selected
                ? {
                    background: 'var(--accent-gradient)',
                    color: '#050311',
                  }
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

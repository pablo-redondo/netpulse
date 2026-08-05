import Link from 'next/link';

export const RANGES = [
  { hours: 24, label: 'Últimas 24 h' },
  { hours: 168, label: 'Últimos 7 días' },
  { hours: 720, label: 'Últimos 30 días' },
] as const;

export function parseRange(value: string | undefined): number {
  const parsed = Number(value);
  return RANGES.some((range) => range.hours === parsed) ? parsed : 24;
}

/**
 * Fila unica de filtro, por encima de todo lo que escopa: cada stat, grafica
 * y tabla de la pagina se recalcula contra la misma ventana.
 */
export function RangeFilter({ basePath, hours }: { basePath: string; hours: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {RANGES.map((range) => {
        const selected = range.hours === hours;
        return (
          <Link
            key={range.hours}
            href={`${basePath}?hours=${range.hours}`}
            aria-current={selected ? 'true' : undefined}
            className={
              selected
                ? 'rounded-md border border-hairline bg-surface-1 px-3 py-1.5 text-sm font-medium text-text-primary'
                : 'rounded-md border border-transparent px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary'
            }
          >
            {range.label}
          </Link>
        );
      })}
    </div>
  );
}

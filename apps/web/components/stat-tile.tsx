import type { ReactNode } from 'react';

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  /** Glifo de tendencia opcional (sparkline). */
  trend?: ReactNode;
}

/**
 * Contrato de stat tile: label en mayusculas discretas como cabecera de
 * campo de terminal, valor grande, y tendencia opcional. El valor va en la
 * cara mono del tema, que ya trae cifras tabulares.
 */
export function StatTile({ label, value, hint, trend }: StatTileProps) {
  return (
    <div className="relative rounded border border-hairline bg-surface-1 p-4 transition-colors hover:border-hairline-strong">
      <div className="text-[11px] tracking-widest text-text-muted uppercase">{label}</div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="text-2xl font-semibold text-text-primary">{value}</div>
        {trend}
      </div>
      {hint && <div className="mt-1.5 text-xs text-text-muted">{hint}</div>}
    </div>
  );
}

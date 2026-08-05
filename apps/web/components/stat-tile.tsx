import type { ReactNode } from 'react';

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  /** Glifo de tendencia opcional (sparkline). */
  trend?: ReactNode;
}

/**
 * Contrato de stat tile: label en sentence case sin dos puntos, valor en sans
 * semibold con cifras proporcionales (nunca tabular-nums en cifras grandes
 * standalone), y tendencia opcional.
 */
export function StatTile({ label, value, hint, trend }: StatTileProps) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-1 p-4">
      <div className="text-sm text-text-secondary">{label}</div>
      <div className="mt-1 flex items-end justify-between gap-3">
        <div className="text-2xl font-semibold text-text-primary">{value}</div>
        {trend}
      </div>
      {hint && <div className="mt-1 text-xs text-text-muted">{hint}</div>}
    </div>
  );
}

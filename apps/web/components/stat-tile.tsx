import type { CSSProperties, ReactNode } from 'react';

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  /** Glifo de tendencia opcional (sparkline). */
  trend?: ReactNode;
  /** Índice para escalonar la animación de entrada respecto a hermanos. */
  stagger?: number;
}

/**
 * Contrato de stat tile: label en mayúsculas discretas como cabecera de
 * campo, valor grande en cifra tabular, y tendencia opcional. Cristal con
 * elevación al pasar el cursor, como el resto de superficies interactivas.
 */
export function StatTile({ label, value, hint, trend, stagger }: StatTileProps) {
  const style = stagger !== undefined ? ({ '--stagger': stagger } as CSSProperties) : undefined;
  return (
    <div className="rise-in glass lift relative rounded-2xl p-4" style={style}>
      <div className="text-[11px] font-medium tracking-widest text-text-muted uppercase">
        {label}
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="tabular text-2xl font-semibold text-text-primary">{value}</div>
        {trend}
      </div>
      {hint && <div className="mt-1.5 text-xs text-text-muted">{hint}</div>}
    </div>
  );
}

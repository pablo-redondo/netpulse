'use client';

import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react';

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  /** Glifo de tendencia opcional (sparkline). */
  trend?: ReactNode;
  /** Índice para escalonar la animación de entrada respecto a hermanos. */
  stagger?: number;
}

function trackPointer(event: ReactPointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width) * 100}%`);
  event.currentTarget.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height) * 100}%`);
}

/**
 * Contrato de stat tile: etiqueta discreta como cabecera de campo, valor
 * grande en cifra tabular, y tendencia opcional. Cristal con elevación y un
 * foco de luz que sigue al cursor, como el resto de superficies interactivas.
 */
export function StatTile({ label, value, hint, trend, stagger }: StatTileProps) {
  const style = stagger !== undefined ? ({ '--stagger': stagger } as CSSProperties) : undefined;
  return (
    <div
      className="rise-in glass spotlight lift relative rounded-2xl p-4"
      style={style}
      onPointerMove={trackPointer}
    >
      <div className="text-[11px] font-medium text-text-muted">{label}</div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="tabular text-2xl font-semibold text-text-primary">{value}</div>
        {trend}
      </div>
      {hint && <div className="mt-1.5 text-xs text-text-muted">{hint}</div>}
    </div>
  );
}

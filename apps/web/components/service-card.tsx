'use client';

import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import type { ServiceOverview } from '@/lib/api';
import { formatLatency, formatRelative, formatUptime, stateOf } from '@/lib/format';
import { StatusBadge, statusColor } from '@/components/status-badge';
import { UptimeBars } from '@/components/uptime-bars';

// Escanea el panel al pasar el ratón (clase `.scan-glow` en globals.css);
// escribe directamente en el estilo del nodo en vez de pasar por estado de
// React, para que el gesto no dispare un re-render por cada pixel de
// movimiento del ratón.
function trackPointer(event: ReactPointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width) * 100}%`);
  event.currentTarget.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height) * 100}%`);
}

export function ServiceCard({
  overview,
  stagger,
}: {
  overview: ServiceOverview;
  stagger?: number;
}) {
  const { service, latest, uptime, history } = overview;
  const state = stateOf(latest, uptime.uptimePercent);
  const style = stagger !== undefined ? ({ '--stagger': stagger } as CSSProperties) : undefined;

  return (
    <Link
      href={`/services/${service.id}`}
      style={style}
      onPointerMove={trackPointer}
      className="rise-in panel scan-glow lift group relative block overflow-hidden p-4"
    >
      {/* Filo de estado: refuerza el badge, nunca lo sustituye. */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px] transition-all group-hover:w-1"
        style={{ background: statusColor(state), boxShadow: `0 0 12px ${statusColor(state)}` }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-medium text-text-primary">{service.name}</div>
          <div className="mt-0.5 truncate text-xs text-text-muted">
            <span className="text-accent">›</span> {service.target}
          </div>
        </div>
        <span className="shrink-0 rounded border border-hairline px-1.5 py-0.5 text-[10px] font-medium tracking-widest text-text-muted">
          {service.type}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <StatusBadge state={state} />
        <span className="tabular text-lg leading-none font-semibold text-text-primary">
          {formatUptime(uptime.uptimePercent)}
        </span>
      </div>

      <div className="mt-3">
        <UptimeBars stats={history} label={`Disponibilidad de ${service.name}`} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3 text-xs text-text-muted">
        <span className="tabular">{formatLatency(latest?.latencyMs)}</span>
        <span>{latest ? formatRelative(latest.timestamp) : 'sin comprobaciones'}</span>
      </div>
    </Link>
  );
}

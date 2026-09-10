import type { CSSProperties } from 'react';
import Link from 'next/link';
import type { ServiceOverview } from '@/lib/api';
import { formatLatency, formatRelative, formatUptime, stateOf } from '@/lib/format';
import { StatusBadge, statusColor } from '@/components/status-badge';
import { UptimeBars } from '@/components/uptime-bars';

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
      className="rise-in glass glass-edge lift group relative block overflow-hidden rounded-2xl p-4"
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
            <span className="text-gradient font-medium">›</span> {service.target}
          </div>
        </div>
        <span className="glass shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-widest text-text-muted">
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

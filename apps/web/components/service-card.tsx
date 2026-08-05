import Link from 'next/link';
import type { ServiceOverview } from '@/lib/api';
import { formatLatency, formatRelative, formatUptime, stateOf } from '@/lib/format';
import { StatusBadge } from '@/components/status-badge';
import { Sparkline } from '@/components/sparkline';

export function ServiceCard({ overview }: { overview: ServiceOverview }) {
  const { service, latest, uptime, history } = overview;
  const state = stateOf(latest, uptime.uptimePercent);

  return (
    <Link
      href={`/services/${service.id}`}
      className="block rounded-lg border border-hairline bg-surface-1 p-4 transition-colors hover:border-text-muted"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-medium text-text-primary">{service.name}</div>
          <div className="truncate font-mono text-xs text-text-muted">{service.target}</div>
        </div>
        <span className="shrink-0 rounded border border-hairline px-1.5 py-0.5 text-[11px] font-medium text-text-secondary">
          {service.type}
        </span>
      </div>

      <div className="mt-3">
        <StatusBadge state={state} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-xs text-text-secondary">Disponibilidad</div>
          <div className="text-lg font-semibold text-text-primary">
            {formatUptime(uptime.uptimePercent)}
          </div>
        </div>
        <Sparkline
          values={history.map((stat) => stat.avgLatencyMs)}
          label={`Latencia de ${service.name}`}
        />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3 text-xs text-text-muted">
        <span className="tabular">{formatLatency(latest?.latencyMs)}</span>
        <span>{latest ? formatRelative(latest.timestamp) : 'sin comprobaciones'}</span>
      </div>
    </Link>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ApiUnavailableError,
  getHistory,
  getRecentChecks,
  getService,
  getStatus,
  getUptime,
} from '@/lib/api';
import { formatLatency, formatRelative, formatUptime, stateOf } from '@/lib/format';
import { ApiUnavailable } from '@/components/api-unavailable';
import { ChecksTable } from '@/components/checks-table';
import { HistoryTable } from '@/components/history-table';
import { LatencyChart } from '@/components/latency-chart';
import { RangeFilter, parseRange } from '@/components/range-filter';
import { StatTile } from '@/components/stat-tile';
import { StatusBadge, statusLabel } from '@/components/status-badge';

export default async function ServiceDetailPage(props: PageProps<'/services/[id]'>) {
  const { id } = await props.params;
  const { hours: hoursParam } = await props.searchParams;
  const hours = parseRange(typeof hoursParam === 'string' ? hoursParam : undefined);

  let data;
  try {
    const service = await getService(id);
    const [latest, uptime, history, checks] = await Promise.all([
      getStatus(id),
      getUptime(id, hours),
      getHistory(id, hours),
      getRecentChecks(id, 20),
    ]);
    data = { service, latest, uptime, history, checks };
  } catch (error) {
    if (error instanceof ApiUnavailableError) return <ApiUnavailable />;
    notFound();
  }

  const { service, latest, uptime, history, checks } = data;
  const state = stateOf(latest, uptime.uptimePercent);

  const latencies = history
    .map((stat) => stat.avgLatencyMs)
    .filter((value): value is number => value !== null);
  const avgLatency =
    latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : null;

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-block text-sm text-text-secondary hover:text-text-primary">
        ← Volver al dashboard
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-text-primary">{service.name}</h1>
            <span className="rounded border border-hairline px-1.5 py-0.5 text-[11px] font-medium text-text-secondary">
              {service.type}
            </span>
          </div>
          <p className="mt-1 font-mono text-sm text-text-muted">{service.target}</p>
        </div>
        <RangeFilter basePath={`/services/${service.id}`} hours={hours} />
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-hairline bg-surface-1 p-4">
          <div className="text-sm text-text-secondary">Estado actual</div>
          <div className="mt-2">
            <StatusBadge state={state} />
          </div>
          <div className="mt-1 text-xs text-text-muted">
            {latest ? formatRelative(latest.timestamp) : 'sin comprobaciones'}
          </div>
        </div>
        <StatTile
          label="Disponibilidad"
          value={formatUptime(uptime.uptimePercent)}
          hint={`${uptime.successChecks} de ${uptime.totalChecks} comprobaciones`}
        />
        <StatTile
          label="Latencia media"
          value={formatLatency(avgLatency)}
          hint="Media de las medias horarias"
        />
        <StatTile
          label="Última latencia"
          value={formatLatency(latest?.latencyMs)}
          hint={statusLabel(state)}
        />
      </section>

      <LatencyChart stats={history} hours={hours} />
      <HistoryTable stats={history} />
      <ChecksTable checks={checks} />
    </div>
  );
}

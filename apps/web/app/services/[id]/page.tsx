import type { CSSProperties } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ApiUnavailableError,
  getHistory,
  getRecentChecks,
  getService,
  getServiceIncidents,
  getStatus,
  getUptime,
} from '@/lib/api';
import { formatLatency, formatRelative, formatUptime, stateOf } from '@/lib/format';
import { ApiUnavailable } from '@/components/api-unavailable';
import { ChecksTable } from '@/components/checks-table';
import { HistoryTable } from '@/components/history-table';
import { IncidentList } from '@/components/incident-list';
import { LatencyChart } from '@/components/latency-chart';
import { Panel } from '@/components/panel';
import { RangeFilter, parseRange } from '@/components/range-filter';
import { Sparkline } from '@/components/sparkline';
import { StatTile } from '@/components/stat-tile';
import { StatusBadge, statusColor, statusLabel } from '@/components/status-badge';

export default async function ServiceDetailPage(props: PageProps<'/services/[id]'>) {
  const { id } = await props.params;
  const { hours: hoursParam } = await props.searchParams;
  const hours = parseRange(typeof hoursParam === 'string' ? hoursParam : undefined);

  let data;
  try {
    const service = await getService(id);
    const [latest, uptime, history, checks, incidents] = await Promise.all([
      getStatus(id),
      getUptime(id, hours),
      getHistory(id, hours),
      getRecentChecks(id, 20),
      getServiceIncidents(id, 10),
    ]);
    data = { service, latest, uptime, history, checks, incidents };
  } catch (error) {
    if (error instanceof ApiUnavailableError) return <ApiUnavailable />;
    notFound();
  }

  const { service, latest, uptime, history, checks, incidents } = data;
  const state = stateOf(latest, uptime.uptimePercent);

  const latencies = history
    .map((stat) => stat.avgLatencyMs)
    .filter((value): value is number => value !== null);
  const avgLatency =
    latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : null;

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-text-secondary"
      >
        <span aria-hidden>←</span> volver al dashboard
      </Link>

      {/* Cabecera del servicio, con el filo de estado a la izquierda */}
      <div className="glass rise-in relative overflow-hidden rounded-3xl p-5 sm:p-6">
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ background: statusColor(state), boxShadow: `0 0 14px ${statusColor(state)}` }}
        />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold text-text-primary">{service.name}</h1>
              <span className="glass rounded-full px-2 py-0.5 text-[10px] font-medium tracking-widest text-text-muted">
                {service.type}
              </span>
            </div>
            <p className="mt-1 truncate text-sm text-text-muted">
              <span className="text-gradient font-medium">›</span> {service.target}
            </p>
            {service.expectedContent && (
              <p className="mt-1 text-xs text-text-muted">
                Verifica que la respuesta contiene:{' '}
                <span className="text-text-secondary">
                  &quot;{service.expectedContent}&quot;
                </span>
              </p>
            )}
          </div>
          <RangeFilter basePath={`/services/${service.id}`} hours={hours} />
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass lift rise-in rounded-2xl p-4" style={{ '--stagger': 0 } as CSSProperties}>
          <div className="text-[13px] font-medium text-text-muted">Estado actual</div>
          <div className="mt-2">
            <StatusBadge state={state} />
          </div>
          <div className="mt-1.5 text-xs text-text-muted">
            {latest ? formatRelative(latest.timestamp) : 'sin comprobaciones'}
          </div>
          {latest?.details && (
            <div className="mt-1 truncate text-xs text-text-secondary" title={latest.details}>
              {latest.details}
            </div>
          )}
        </div>
        <StatTile
          label="Disponibilidad"
          value={formatUptime(uptime.uptimePercent)}
          hint={`${uptime.successChecks} de ${uptime.totalChecks} comprobaciones`}
          stagger={1}
        />
        <StatTile
          label="Latencia media"
          value={formatLatency(avgLatency)}
          hint="Media de las medias horarias"
          stagger={2}
          trend={
            <Sparkline
              values={history.map((stat) => stat.avgLatencyMs)}
              label={`Latencia de ${service.name}`}
            />
          }
        />
        <StatTile
          label="Última latencia"
          value={formatLatency(latest?.latencyMs)}
          hint={statusLabel(state)}
          stagger={3}
        />
      </section>

      <LatencyChart stats={history} hours={hours} />
      <HistoryTable stats={history} />
      <ChecksTable checks={checks} />

      <Panel
        title="Incidentes recientes"
        meta={
          <a
            href={`/services/${service.id}/export?hours=${hours}`}
            className="text-text-muted transition-colors hover:text-accent-2"
          >
            ↓ exportar CSV
          </a>
        }
      >
        <IncidentList incidents={incidents} />
      </Panel>
    </div>
  );
}

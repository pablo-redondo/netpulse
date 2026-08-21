import type { Incident } from '@netpulse/shared-types';
import { formatDateTime } from '@/lib/format';

function formatIncidentDuration(startedAt: string, resolvedAt: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
  const minutes = Math.round((end - start) / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60} min`;
}

export function IncidentList({
  incidents,
  showServiceName = false,
}: {
  incidents: Incident[];
  showServiceName?: boolean;
}) {
  if (incidents.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        <span className="text-accent">✓</span> Sin incidentes registrados en el periodo
        mostrado.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-hairline">
      {incidents.map((incident) => {
        const isOpen = incident.resolvedAt === null;
        return (
          <li key={incident.id} className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                {/* Estado del incidente: color + texto, nunca color a secas. */}
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background: isOpen
                      ? 'var(--status-critical)'
                      : 'var(--status-good)',
                  }}
                />
                <span className="truncate">
                  {showServiceName && (
                    <span className="text-text-secondary">{incident.serviceName} · </span>
                  )}
                  {isOpen ? 'Caída en curso' : 'Caída resuelta'}
                </span>
              </div>
              {incident.cause && (
                <p className="mt-1 pl-4 text-xs text-text-muted">{incident.cause}</p>
              )}
            </div>
            <div className="shrink-0 text-right text-xs">
              <div className="tabular text-text-secondary">
                {formatDateTime(incident.startedAt)}
              </div>
              <div className="tabular text-text-muted">
                {formatIncidentDuration(incident.startedAt, incident.resolvedAt)}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

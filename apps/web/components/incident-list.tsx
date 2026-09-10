import type { CSSProperties } from 'react';
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
        <span className="text-gradient font-medium">✓</span> Sin incidentes registrados en el
        periodo mostrado.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-hairline">
      {incidents.map((incident, index) => {
        const isOpen = incident.resolvedAt === null;
        const dotColor = isOpen ? 'var(--status-critical)' : 'var(--status-good)';
        return (
          <li
            key={incident.id}
            className="fade-in flex items-start justify-between gap-4 py-3"
            style={{ '--stagger': index } as CSSProperties}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                {/* Estado del incidente: color + texto, nunca color a secas. */}
                <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
                  {isOpen && (
                    <span
                      aria-hidden
                      className="pulse-ring-critical absolute h-2 w-2 rounded-full"
                      style={{ background: dotColor }}
                    />
                  )}
                  <span
                    aria-hidden
                    className="relative h-2 w-2 rounded-full"
                    style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }}
                  />
                </span>
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

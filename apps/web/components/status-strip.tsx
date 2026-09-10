import type { CSSProperties } from 'react';
import type { ServiceOverview } from '@/lib/api';
import { stateOf, type ServiceState } from '@/lib/format';
import { statusColor, statusLabel } from '@/components/status-badge';

// Mismo criterio que en las barras de disponibilidad: lo sano se atenúa para
// que lo que falla sea lo que salta a la vista.
function stripColor(state: ServiceState): string {
  return state === 'up' ? 'var(--status-good-dim)' : statusColor(state);
}

/**
 * Tira de estado: un bloque por servicio, para leer la flota entera de un
 * vistazo. Es un resumen redundante -cada servicio aparece justo debajo con
 * su icono y su etiqueta de texto-, así que aquí el color puede ir solo sin
 * dejar información inaccesible. Cada bloque lleva además su título nativo.
 */
export function StatusStrip({ overviews }: { overviews: ServiceOverview[] }) {
  if (overviews.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1" aria-hidden>
      {overviews.map((overview, index) => {
        const state = stateOf(overview.latest, overview.uptime.uptimePercent);
        const color = stripColor(state);
        return (
          <span
            key={overview.service.id}
            title={`${overview.service.name} — ${statusLabel(state)}`}
            className="fade-in h-5 w-2.5 rounded-[1px] transition-transform hover:scale-125"
            style={
              {
                background: color,
                boxShadow: state !== 'up' ? `0 0 8px ${color}` : 'none',
                '--stagger': index,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

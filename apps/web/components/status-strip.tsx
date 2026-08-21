import type { ServiceOverview } from '@/lib/api';
import { stateOf, type ServiceState } from '@/lib/format';
import { statusColor, statusLabel } from '@/components/status-badge';

// Mismo criterio que en las barras de disponibilidad: lo sano se atenua para
// que lo que falla sea lo que salta a la vista.
function stripColor(state: ServiceState): string {
  return state === 'up' ? 'var(--status-good-dim)' : statusColor(state);
}

/**
 * Tira de estado: un bloque por servicio, para leer la flota entera de un
 * vistazo. Es un resumen redundante — cada servicio aparece justo debajo con
 * su icono y su etiqueta de texto —, asi que aqui el color puede ir solo sin
 * dejar informacion inaccesible. Cada bloque lleva ademas su titulo nativo.
 */
export function StatusStrip({ overviews }: { overviews: ServiceOverview[] }) {
  if (overviews.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1" aria-hidden>
      {overviews.map((overview) => {
        const state = stateOf(overview.latest, overview.uptime.uptimePercent);
        return (
          <span
            key={overview.service.id}
            title={`${overview.service.name} — ${statusLabel(state)}`}
            className="h-5 w-2.5 rounded-[1px]"
            style={{ background: stripColor(state) }}
          />
        );
      })}
    </div>
  );
}

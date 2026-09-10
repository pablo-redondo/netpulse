import { ApiUnavailableError, getDashboard, getRecentIncidents } from '@/lib/api';
import { stateOf, type ServiceState } from '@/lib/format';
import { ApiUnavailable } from '@/components/api-unavailable';
import { IncidentList } from '@/components/incident-list';
import { Panel } from '@/components/panel';
import { ServiceCard } from '@/components/service-card';
import { StatusBadge, statusColor } from '@/components/status-badge';

// Peor estado observado entre todos los servicios: down > unstable > unknown > up.
function overallState(states: ServiceState[]): ServiceState {
  if (states.some((state) => state === 'down')) return 'down';
  if (states.some((state) => state === 'unstable')) return 'unstable';
  if (states.length > 0 && states.every((state) => state === 'unknown')) return 'unknown';
  return 'up';
}

const OVERALL_COPY: Record<ServiceState, string> = {
  up: 'Todos los sistemas operativos.',
  unstable: 'Rendimiento degradado en uno o más servicios.',
  down: 'Incidencia activa en uno o más servicios.',
  unknown: 'Sin datos suficientes todavía.',
};

// Vista pública y simplificada, pensada para compartir sin dar acceso al
// resto del panel: solo estado agregado, servicios y el feed de incidentes.
export default async function StatusPage() {
  let overviews;
  let incidents;
  try {
    [overviews, incidents] = await Promise.all([getDashboard(24), getRecentIncidents(15)]);
  } catch (error) {
    if (error instanceof ApiUnavailableError) return <ApiUnavailable />;
    throw error;
  }

  const overall = overallState(
    overviews.map((overview) => stateOf(overview.latest, overview.uptime.uptimePercent)),
  );
  const color = statusColor(overall);

  return (
    <div className="space-y-8">
      {/* Banner de estado global: el color se apoya siempre en el badge, que
          trae icono y etiqueta. */}
      <section className="glass-edge glass rise-in relative overflow-hidden rounded-3xl p-8 text-center sm:p-10">
        <div
          aria-hidden
          className="float-y pointer-events-none absolute inset-x-0 -top-32 mx-auto h-64 w-64 rounded-full opacity-30 blur-3xl"
          style={{ background: color }}
        />
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ background: color, boxShadow: `0 0 12px ${color}` }}
        />
        <div className="relative flex justify-center">
          <StatusBadge state={overall} />
        </div>
        <p className="relative mt-3 text-lg font-medium text-text-primary">
          {OVERALL_COPY[overall]}
        </p>
        <p className="relative mt-1 text-xs text-text-muted">
          {overviews.length} servicios · ventana de 24 h
        </p>
      </section>

      <section>
        <div className="rule-label mb-4">
          <h2 className="text-sm font-medium text-text-primary">
            <span className="text-gradient font-semibold">#</span> Servicios
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {overviews.map((overview, index) => (
            <ServiceCard key={overview.service.id} overview={overview} stagger={index} />
          ))}
        </div>
      </section>

      <Panel title="Incidentes recientes" meta={`${incidents.length} registrados`}>
        <IncidentList incidents={incidents} showServiceName />
      </Panel>
    </div>
  );
}

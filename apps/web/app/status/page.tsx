import { ApiUnavailableError, getDashboard, getRecentIncidents } from '@/lib/api';
import { stateOf, type ServiceState } from '@/lib/format';
import { ApiUnavailable } from '@/components/api-unavailable';
import { IncidentList } from '@/components/incident-list';
import { ServiceCard } from '@/components/service-card';
import { StatusBadge } from '@/components/status-badge';

// Peor estado observado entre todos los servicios: down > unstable > unknown > up.
function overallState(states: ServiceState[]): ServiceState {
  if (states.some((state) => state === 'down')) return 'down';
  if (states.some((state) => state === 'unstable')) return 'unstable';
  if (states.every((state) => state === 'unknown')) return 'unknown';
  return 'up';
}

const OVERALL_COPY: Record<ServiceState, string> = {
  up: 'Todos los sistemas operativos.',
  unstable: 'Rendimiento degradado en uno o más servicios.',
  down: 'Incidencia activa en uno o más servicios.',
  unknown: 'Sin datos suficientes todavía.',
};

// Vista publica y simplificada, pensada para compartir sin dar acceso al
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

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-hairline bg-surface-1 p-6 text-center">
        <div className="flex justify-center">
          <StatusBadge state={overall} />
        </div>
        <p className="mt-2 text-sm text-text-secondary">{OVERALL_COPY[overall]}</p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-text-primary">Servicios</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {overviews.map((overview) => (
            <ServiceCard key={overview.service.id} overview={overview} />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-hairline bg-surface-1 p-4">
        <h2 className="mb-2 text-sm font-medium text-text-primary">Incidentes recientes</h2>
        <IncidentList incidents={incidents} showServiceName />
      </section>
    </div>
  );
}

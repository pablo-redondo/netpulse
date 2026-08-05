import { ApiUnavailableError, getDashboard, type ServiceOverview } from '@/lib/api';
import { stateOf } from '@/lib/format';
import { ApiUnavailable } from '@/components/api-unavailable';
import { StatusBadge } from '@/components/status-badge';
import { TopologyDiagram } from '@/components/topology-diagram';

export default async function TopologyPage() {
  let overviews: ServiceOverview[];
  try {
    overviews = await getDashboard(24);
  } catch (error) {
    if (error instanceof ApiUnavailableError) return <ApiUnavailable />;
    throw error;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Topología</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Agrupación conceptual de los servicios monitorizados en segmentos de red.
        </p>
      </div>

      {/* El aviso va antes del diagrama, no como nota al pie: quien llega aqui
          debe saber que esta viendo antes de interpretarlo. */}
      <div className="rounded-lg border border-hairline bg-surface-1 p-4">
        <h2 className="text-sm font-semibold text-text-primary">
          Esta vista es ilustrativa, no un descubrimiento de red
        </h2>
        <p className="mt-2 max-w-prose text-sm text-text-secondary">
          Las VLAN, las subredes y el router que aparecen abajo están{' '}
          <strong className="font-medium text-text-primary">asignados a mano</strong> a cada
          servicio monitorizado. NetPulse no tiene acceso a routers, switches ni a la
          infraestructura real de los servicios que comprueba: no ejecuta ningún tipo de
          escaneo ni descubrimiento de topología.
        </p>
        <p className="mt-2 max-w-prose text-sm text-text-secondary">
          Lo único real en el diagrama es el{' '}
          <strong className="font-medium text-text-primary">estado de cada servicio</strong>,
          que sí procede de las comprobaciones HTTP, DNS y TCP efectivamente realizadas.
        </p>
      </div>

      <TopologyDiagram overviews={overviews} />

      <div className="rounded-lg border border-hairline bg-surface-1 p-4">
        <h2 className="text-sm font-medium text-text-primary">Leyenda</h2>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          <StatusBadge state="up" />
          <StatusBadge state="unstable" />
          <StatusBadge state="down" />
          <StatusBadge state="unknown" />
        </div>
        <p className="mt-3 text-xs text-text-muted">
          Cada segmento toma el peor estado de los servicios que contiene.{' '}
          {overviews.filter((o) => stateOf(o.latest, o.uptime.uptimePercent) === 'down').length}{' '}
          de {overviews.length} servicios están caídos ahora mismo.
        </p>
      </div>
    </div>
  );
}

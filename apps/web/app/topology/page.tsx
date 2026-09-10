import { ApiUnavailableError, getDashboard, type ServiceOverview } from '@/lib/api';
import { stateOf } from '@/lib/format';
import { ApiUnavailable } from '@/components/api-unavailable';
import { Panel } from '@/components/panel';
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

  const down = overviews.filter(
    (o) => stateOf(o.latest, o.uptime.uptimePercent) === 'down',
  ).length;

  return (
    <div className="space-y-5">
      <div className="rise-in flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-xl font-semibold text-text-primary">
          <span className="text-accent font-semibold">#</span> Topología
        </h1>
        <p className="text-sm text-text-muted">
          {overviews.length} servicios · {down} caídos ahora mismo
        </p>
      </div>

      {/* Aviso y leyenda uno junto al otro, no apilados: el aviso es un
          párrafo corto, y a todo el ancho de la página dejaba una columna de
          texto angosta con medio panel vacío a la derecha. En dos columnas
          se aprovecha el ancho y además la leyenda sube por encima del
          diagrama, donde hace falta antes de leerlo, no después. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <Panel title="Esta vista es ilustrativa, no un descubrimiento de red" stagger={1}>
          <p className="text-sm text-text-secondary">
            Las VLAN, las subredes y el router que aparecen abajo están{' '}
            <strong className="font-medium text-text-primary">asignados a mano</strong> a cada
            servicio monitorizado. NetPulse no tiene acceso a routers, switches ni a la
            infraestructura real de los servicios que comprueba.
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            Lo único real en el diagrama es el{' '}
            <strong className="font-medium text-text-primary">estado de cada servicio</strong>,
            que sí procede de las comprobaciones HTTP, DNS, TCP, TLS y NTP efectivamente
            realizadas.
          </p>
        </Panel>

        <Panel title="Leyenda" stagger={1}>
          <div className="flex flex-col gap-2">
            <StatusBadge state="up" />
            <StatusBadge state="unstable" />
            <StatusBadge state="down" />
            <StatusBadge state="unknown" />
          </div>
          <p className="mt-3 text-xs text-text-muted">
            Cada segmento toma el peor estado de los servicios que contiene.
          </p>
        </Panel>
      </div>

      <TopologyDiagram overviews={overviews} />
    </div>
  );
}

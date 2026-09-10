import { ApiUnavailableError, getDashboard, type ServiceOverview } from '@/lib/api';
import { formatLatency, splitVlanGroup, stateOf } from '@/lib/format';
import { ApiUnavailable } from '@/components/api-unavailable';
import { CountUp } from '@/components/count-up';
import { PulseWave } from '@/components/pulse-wave';
import { RangeFilter, parseRange } from '@/components/range-filter';
import { ServiceCard } from '@/components/service-card';
import { StatTile } from '@/components/stat-tile';
import { StatusStrip } from '@/components/status-strip';

const UNGROUPED = 'Sin grupo asignado';

function groupByVlan(overviews: ServiceOverview[]): [string, ServiceOverview[]][] {
  const groups = new Map<string, ServiceOverview[]>();
  for (const overview of overviews) {
    const key = overview.service.vlanGroup ?? UNGROUPED;
    groups.set(key, [...(groups.get(key) ?? []), overview]);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, 'es'));
}

export default async function DashboardPage(props: PageProps<'/'>) {
  const { hours: hoursParam } = await props.searchParams;
  const hours = parseRange(typeof hoursParam === 'string' ? hoursParam : undefined);

  let overviews: ServiceOverview[];
  try {
    overviews = await getDashboard(hours);
  } catch (error) {
    if (error instanceof ApiUnavailableError) return <ApiUnavailable />;
    throw error;
  }

  const operational = overviews.filter(
    (overview) => stateOf(overview.latest, overview.uptime.uptimePercent) === 'up',
  ).length;

  const totalChecks = overviews.reduce((sum, o) => sum + o.uptime.totalChecks, 0);
  const totalSuccess = overviews.reduce((sum, o) => sum + o.uptime.successChecks, 0);
  const globalUptime = totalChecks > 0 ? (totalSuccess / totalChecks) * 100 : null;

  const latencies = overviews
    .map((overview) => overview.latest?.latencyMs)
    .filter((latency): latency is number => typeof latency === 'number');
  const avgLatency =
    latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : null;

  const groups = groupByVlan(overviews);

  return (
    <div className="space-y-10">
      {/* Hero: la cifra que lidera la vista. La traza de pulso -el motivo de
          marca, literal- va como lectura de monitor junto al número, no de
          fondo a todo el ancho: ahí competía con la tira de sondas de abajo
          y quedaba cortada por la esquina de escáner. Único panel con
          esquinas de escáner: es la portada, no un adorno que se repite. */}
      <section className="scan-frame panel rise-in relative overflow-hidden p-6 sm:p-8">
        <span className="scan-corner-tr" aria-hidden />
        <span className="scan-corner-bl" aria-hidden />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[13px] font-medium text-text-muted">Disponibilidad global</div>
            <div className="mt-1 flex flex-wrap items-end gap-4">
              <CountUp
                value={globalUptime}
                className="glow block text-[56px] leading-none font-bold text-accent [font-variant-numeric:tabular-nums]"
              />
              <PulseWave className="mb-2.5 hidden opacity-80 sm:block" />
            </div>
            <p className="mt-2 text-sm text-text-muted">
              {totalChecks.toLocaleString('es-ES')} comprobaciones agregadas en la ventana
              seleccionada
            </p>
          </div>
          <RangeFilter basePath="/" hours={hours} />
        </div>

        <div className="relative mt-6 border-t border-hairline pt-4">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <span className="text-[13px] font-medium text-text-muted">Sondas activas</span>
            <span className="text-xs text-text-muted">
              {overviews.length} servicios públicos
            </span>
          </div>
          <StatusStrip overviews={overviews} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Servicios operativos"
          value={`${operational} / ${overviews.length}`}
          hint="Última comprobación correcta y sin caídas recientes"
          stagger={0}
        />
        <StatTile
          label="Latencia media actual"
          value={formatLatency(avgLatency)}
          hint="Media de la última comprobación de cada servicio"
          stagger={1}
        />
        <StatTile
          label="Comprobaciones registradas"
          value={totalChecks.toLocaleString('es-ES')}
          hint="Suma de todos los servicios en la ventana"
          stagger={2}
        />
      </section>

      {groups.map(([group, services]) => {
        const { label, cidr } = splitVlanGroup(group);
        return (
          <section key={group}>
            <div className="rule-label mb-4">
              <h2 className="text-sm font-medium text-text-primary">
                <span className="text-accent font-semibold">#</span> {label}
              </h2>
              {cidr && <span className="tabular text-xs text-text-muted">{cidr}</span>}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((overview, index) => (
                <ServiceCard key={overview.service.id} overview={overview} stagger={index} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

import type { ServiceOverview } from '@/lib/api';
import { splitVlanGroup, stateOf, type ServiceState } from '@/lib/format';
import { StateIcon, statusColor, statusIcon } from '@/components/status-badge';

const GROUP_WIDTH = 280;
const GROUP_GAP = 20;
const CONNECTOR_HEIGHT = 40;

const STATE_COLOR: Record<ServiceState, string> = {
  up: 'var(--status-good)',
  unstable: 'var(--status-warning)',
  down: 'var(--status-critical)',
  unknown: 'var(--text-muted)',
};

/** Peor estado del grupo: un caido manda sobre un inestable, y este sobre OK. */
function aggregateState(states: ServiceState[]): ServiceState {
  if (states.includes('down')) return 'down';
  if (states.includes('unstable')) return 'unstable';
  if (states.length > 0 && states.every((state) => state === 'unknown')) return 'unknown';
  return 'up';
}

/**
 * Diagrama de topología: cada segmento es una tarjeta CSS normal -no una
 * celda dentro de un único lienzo SVG. Antes las tres cajas (SVG, con alto
 * fijado a mano) compartían la altura del grupo con más servicios, así que
 * un grupo con 4 servicios arrastraba el mismo alto que uno con 10 y dejaba
 * un hueco enorme debajo. Con tarjetas reales y `items-start`, cada una mide
 * justo lo que necesita su propio contenido -el layout normal del navegador
 * hace el trabajo en vez de un cálculo de altura a mano.
 *
 * Solo el conector -tronco + ramas hacia cada grupo- sigue siendo SVG: es
 * una franja de altura fija que no depende del contenido, así que nunca
 * introduce hueco muerto, y comparte las mismas coordenadas en píxeles que
 * las tarjetas de abajo (mismo ancho de columna, mismo hueco), así que
 * quedan perfectamente alineadas sin medir nada en tiempo de ejecución.
 */
export function TopologyDiagram({ overviews }: { overviews: ServiceOverview[] }) {
  const groups = new Map<string, ServiceOverview[]>();
  for (const overview of overviews) {
    const key = overview.service.vlanGroup ?? 'Sin grupo asignado';
    groups.set(key, [...(groups.get(key) ?? []), overview]);
  }
  const entries = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, 'es'));

  const columns = Math.max(entries.length, 1);
  const totalWidth = columns * GROUP_WIDTH + (columns - 1) * GROUP_GAP;
  const trunkX = totalWidth / 2;
  const branchY = CONNECTOR_HEIGHT / 2;

  return (
    <div className="panel rise-in overflow-x-auto p-4">
      <div className="mx-auto flex flex-col items-center" style={{ width: totalWidth }}>
        {/* Router / gateway ilustrativo */}
        <div className="panel-strong inline-flex items-center gap-3 px-5 py-3">
          <span className="term-dots" aria-hidden>
            <span />
            <span />
            <span />
          </span>
          <div>
            <div className="text-sm font-semibold text-text-primary">Router / Gateway</div>
            <div className="tabular text-[11px] text-text-muted">10.0.0.1</div>
          </div>
        </div>

        <svg
          width={totalWidth}
          height={CONNECTOR_HEIGHT}
          viewBox={`0 0 ${totalWidth} ${CONNECTOR_HEIGHT}`}
          className="shrink-0"
          aria-hidden
        >
          <path
            d={`M${trunkX},0 L${trunkX},${branchY}`}
            fill="none"
            stroke="var(--axis)"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          {entries.map(([group, services], index) => {
            const cx = index * (GROUP_WIDTH + GROUP_GAP) + GROUP_WIDTH / 2;
            const state = aggregateState(
              services.map((s) => stateOf(s.latest, s.uptime.uptimePercent)),
            );
            const d = `M${trunkX},${branchY} L${cx},${branchY} L${cx},${CONNECTOR_HEIGHT}`;
            return (
              <g key={`link-${group}`}>
                <path
                  d={d}
                  fill="none"
                  stroke={STATE_COLOR[state]}
                  strokeWidth={5}
                  strokeOpacity={0.14}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={d}
                  fill="none"
                  stroke={STATE_COLOR[state]}
                  strokeWidth={1.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}
        </svg>

        {/* Segmentos: fila flex con `items-start`, así ninguna tarjeta se
            estira para igualar a su vecina más alta. */}
        <div className="flex items-start gap-5">
          {entries.map(([group, services]) => {
            const { label, cidr } = splitVlanGroup(group);
            const state = aggregateState(
              services.map((s) => stateOf(s.latest, s.uptime.uptimePercent)),
            );
            return (
              <div
                key={group}
                className="panel overflow-hidden"
                style={{ width: GROUP_WIDTH }}
              >
                <div className="term-bar">
                  <StateIcon icon={statusIcon(state)} color={STATE_COLOR[state]} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-text-primary">
                      {label}
                    </div>
                  </div>
                  {cidr && (
                    <div className="tabular shrink-0 text-[11px] text-text-muted">{cidr}</div>
                  )}
                </div>
                <ul className="divide-y divide-hairline">
                  {services.map((overview) => {
                    const rowState = stateOf(overview.latest, overview.uptime.uptimePercent);
                    return (
                      <li
                        key={overview.service.id}
                        className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                        title={`${overview.service.name} — ${overview.service.target}`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <StateIcon icon={statusIcon(rowState)} color={statusColor(rowState)} />
                          <span className="truncate text-text-secondary">
                            {overview.service.name}
                          </span>
                        </span>
                        <span className="shrink-0 text-[10px] tracking-wide text-text-muted">
                          {overview.service.type}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

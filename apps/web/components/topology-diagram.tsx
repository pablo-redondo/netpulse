import type { ServiceOverview } from '@/lib/api';
import { splitVlanGroup, stateOf, type ServiceState } from '@/lib/format';

const CANVAS_WIDTH = 920;
const GATEWAY = { width: 200, height: 52, y: 24 };
const GROUP = { width: 280, gap: 20, y: 150, headerHeight: 52, rowHeight: 34, padBottom: 14 };

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

function truncate(text: string, max = 30): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

/**
 * Glifo de estado: la forma acompana al color, para que el estado no dependa
 * solo del tono.
 */
function StateGlyph({ state, x, y }: { state: ServiceState; x: number; y: number }) {
  const color = STATE_COLOR[state];
  const common = {
    stroke: color,
    strokeWidth: 1.6,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (state === 'down') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <circle cx={0} cy={0} r={5.5} {...common} />
        <path d="M-2.2,-2.2 L2.2,2.2 M2.2,-2.2 L-2.2,2.2" {...common} />
      </g>
    );
  }
  if (state === 'unstable') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <path d="M0,-6 L6.4,5.2 L-6.4,5.2 Z" {...common} />
        <path d="M0,-2.2 L0,1 M0,3 L0,3.1" {...common} />
      </g>
    );
  }
  if (state === 'unknown') {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <circle cx={0} cy={0} r={5.5} {...common} />
        <path d="M-2.4,0 L2.4,0" {...common} />
      </g>
    );
  }
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx={0} cy={0} r={5.5} {...common} />
      <path d="M-2.6,0.2 L-0.8,2 L2.6,-1.8" {...common} />
    </g>
  );
}

export function TopologyDiagram({ overviews }: { overviews: ServiceOverview[] }) {
  const groups = new Map<string, ServiceOverview[]>();
  for (const overview of overviews) {
    const key = overview.service.vlanGroup ?? 'Sin grupo asignado';
    groups.set(key, [...(groups.get(key) ?? []), overview]);
  }
  const entries = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, 'es'));

  const columns = Math.max(entries.length, 1);
  const totalWidth = columns * GROUP.width + (columns - 1) * GROUP.gap;
  const startX = (CANVAS_WIDTH - totalWidth) / 2;

  const maxRows = Math.max(...entries.map(([, services]) => services.length), 1);
  const groupHeight = GROUP.headerHeight + maxRows * GROUP.rowHeight + GROUP.padBottom;
  const canvasHeight = GROUP.y + groupHeight + 24;

  const gatewayX = (CANVAS_WIDTH - GATEWAY.width) / 2;
  const gatewayBottom = GATEWAY.y + GATEWAY.height;

  return (
    <div className="overflow-x-auto rounded-lg border border-hairline bg-surface-1 p-4">
      <svg
        viewBox={`0 0 ${CANVAS_WIDTH} ${canvasHeight}`}
        width={CANVAS_WIDTH}
        height={canvasHeight}
        className="h-auto max-w-full min-w-[720px]"
        role="img"
        aria-label="Diagrama conceptual de segmentación en VLAN. Un router central conecta los grupos de servicios monitorizados. Los datos de cada servicio están en el dashboard."
      >
        {/* Tronco del router en neutro: es compartido por todos los grupos, asi
            que no puede llevar el color de estado de ninguno en concreto. */}
        <path
          d={`M${CANVAS_WIDTH / 2},${gatewayBottom} L${CANVAS_WIDTH / 2},${(gatewayBottom + GROUP.y) / 2}`}
          fill="none"
          stroke="var(--axis)"
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* Ramas router → grupo. El color refleja el peor estado del grupo, que
            ademas lleva su glifo y su etiqueta de texto. */}
        {entries.map(([group, services], index) => {
          const boxX = startX + index * (GROUP.width + GROUP.gap);
          const boxCenterX = boxX + GROUP.width / 2;
          const state = aggregateState(
            services.map((s) => stateOf(s.latest, s.uptime.uptimePercent)),
          );
          const midY = (gatewayBottom + GROUP.y) / 2;
          return (
            <path
              key={`link-${group}`}
              d={`M${CANVAS_WIDTH / 2},${midY} L${boxCenterX},${midY} L${boxCenterX},${GROUP.y}`}
              fill="none"
              stroke={STATE_COLOR[state]}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {/* Router / gateway ilustrativo */}
        <rect
          x={gatewayX}
          y={GATEWAY.y}
          width={GATEWAY.width}
          height={GATEWAY.height}
          rx={8}
          fill="var(--surface-1)"
          stroke="var(--axis)"
          strokeWidth={1}
        />
        <text
          x={CANVAS_WIDTH / 2}
          y={GATEWAY.y + 22}
          textAnchor="middle"
          fontSize={13}
          fontWeight={600}
          fill="var(--text-primary)"
        >
          Router / Gateway
        </text>
        <text
          x={CANVAS_WIDTH / 2}
          y={GATEWAY.y + 39}
          textAnchor="middle"
          fontSize={11}
          fill="var(--text-muted)"
        >
          10.0.0.1
        </text>

        {entries.map(([group, services], index) => {
          const boxX = startX + index * (GROUP.width + GROUP.gap);
          const { label, cidr } = splitVlanGroup(group);
          const state = aggregateState(
            services.map((s) => stateOf(s.latest, s.uptime.uptimePercent)),
          );

          return (
            <g key={group}>
              <rect
                x={boxX}
                y={GROUP.y}
                width={GROUP.width}
                height={groupHeight}
                rx={8}
                fill="var(--surface-1)"
                stroke="var(--axis)"
                strokeWidth={1}
              />
              <StateGlyph state={state} x={boxX + 20} y={GROUP.y + 22} />
              <text
                x={boxX + 34}
                y={GROUP.y + 26}
                fontSize={12}
                fontWeight={600}
                fill="var(--text-primary)"
              >
                {truncate(label, 28)}
              </text>
              {cidr && (
                <text x={boxX + 34} y={GROUP.y + 42} fontSize={11} fill="var(--text-muted)">
                  {cidr}
                </text>
              )}
              <line
                x1={boxX}
                y1={GROUP.y + GROUP.headerHeight - 4}
                x2={boxX + GROUP.width}
                y2={GROUP.y + GROUP.headerHeight - 4}
                stroke="var(--gridline)"
                strokeWidth={1}
              />

              {services.map((overview, rowIndex) => {
                const rowY = GROUP.y + GROUP.headerHeight + rowIndex * GROUP.rowHeight + 14;
                const rowState = stateOf(overview.latest, overview.uptime.uptimePercent);
                return (
                  <g key={overview.service.id}>
                    <title>{`${overview.service.name} — ${overview.service.target}`}</title>
                    <StateGlyph state={rowState} x={boxX + 20} y={rowY} />
                    <text x={boxX + 34} y={rowY + 4} fontSize={12} fill="var(--text-secondary)">
                      {truncate(overview.service.name, 26)}
                    </text>
                    <text
                      x={boxX + GROUP.width - 14}
                      y={rowY + 4}
                      textAnchor="end"
                      fontSize={10}
                      fill="var(--text-muted)"
                    >
                      {overview.service.type}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

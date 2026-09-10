'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HourlyStat } from '@netpulse/shared-types';
import { formatLatency } from '@/lib/format';

const PADDING = { top: 16, right: 20, bottom: 28, left: 52 };
const PLOT_HEIGHT = 200;
const HEIGHT = PLOT_HEIGHT + PADDING.top + PADDING.bottom;
const TOOLTIP_HEIGHT = 64;

/** Ticks en numeros redondos (0 / 50 / 100…), no en los extremos crudos. */
function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1];
  const rawStep = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const niceStep =
    (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
  const ticks: number[] = [];
  for (let value = 0; value <= max + niceStep * 0.001; value += niceStep) {
    ticks.push(Number(value.toFixed(6)));
  }
  return ticks;
}

interface Point {
  x: number;
  y: number;
  time: number;
  latency: number;
  stat: HourlyStat;
}

export function LatencyChart({ stats, hours }: { stats: HourlyStat[]; hours: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const plotWidth = Math.max(width - PADDING.left - PADDING.right, 10);

  const { points, ticks, maxLatency } = useMemo(() => {
    const withLatency = stats.filter(
      (stat): stat is HourlyStat & { avgLatencyMs: number } => stat.avgLatencyMs !== null,
    );

    if (withLatency.length === 0) {
      return { points: [] as Point[], ticks: [] as number[], maxLatency: 0 };
    }

    const times = withLatency.map((stat) => new Date(stat.hourBucket).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const timeSpan = maxTime - minTime || 1;

    const max = Math.max(...withLatency.map((stat) => stat.avgLatencyMs));
    const tickValues = niceTicks(max);
    const scaleMax = tickValues[tickValues.length - 1] || 1;

    const computed: Point[] = withLatency.map((stat, index) => {
      const time = times[index];
      return {
        x:
          PADDING.left +
          (withLatency.length === 1 ? plotWidth / 2 : ((time - minTime) / timeSpan) * plotWidth),
        y: PADDING.top + PLOT_HEIGHT - (stat.avgLatencyMs / scaleMax) * PLOT_HEIGHT,
        time,
        latency: stat.avgLatencyMs,
        stat,
      };
    });

    return { points: computed, ticks: tickValues, maxLatency: scaleMax };
  }, [stats, plotWidth]);

  const findNearest = useCallback(
    (clientX: number) => {
      const element = containerRef.current;
      if (!element || points.length === 0) return null;
      const offsetX = clientX - element.getBoundingClientRect().left;
      let nearest = 0;
      let bestDistance = Infinity;
      points.forEach((point, index) => {
        const distance = Math.abs(point.x - offsetX);
        if (distance < bestDistance) {
          bestDistance = distance;
          nearest = index;
        }
      });
      return nearest;
    },
    [points],
  );

  if (points.length === 0) {
    return (
      <div className="glass flex h-40 items-center justify-center rounded-2xl text-sm text-text-muted">
        Todavía no hay latencias registradas en esta ventana.
      </div>
    );
  }

  // Con un unico bucket horario no hay tendencia que dibujar. Un plano vacio
  // con un punto flotando se leeria como una grafica rota, asi que damos la
  // lectura como cifra y decimos que falta historico.
  if (points.length === 1) {
    const only = points[0];
    return (
      <div className="glass rounded-2xl p-4">
        <h2 className="text-xs font-semibold tracking-widest text-text-secondary uppercase">
          Latencia media por hora
        </h2>
        <p className="mt-1 text-xs text-text-muted">Últimas {hours} h · milisegundos</p>
        <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-2xl font-semibold text-text-primary">
            {formatLatency(only.latency)}
          </span>
          <span className="text-sm text-text-secondary">
            {new Date(only.time).toLocaleString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
            {' · '}
            {only.stat.successChecks}/{only.stat.totalChecks} checks OK
          </span>
        </div>
        <p className="mt-3 text-xs text-text-muted">
          Solo hay una hora agregada en esta ventana. La curva de tendencia aparecerá a
          medida que se acumulen más horas de histórico.
        </p>
      </div>
    );
  }

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(' ');

  const baseline = PADDING.top + PLOT_HEIGHT;
  const areaPath =
    points.length > 1
      ? `${linePath} L${points[points.length - 1].x.toFixed(2)},${baseline} L${points[0].x.toFixed(2)},${baseline} Z`
      : '';

  const active = activeIndex !== null ? points[activeIndex] : null;
  const last = points[points.length - 1];

  return (
    <div className="glass rise-in rounded-2xl p-4">
      <div className="mb-3">
        <h2 className="text-xs font-semibold tracking-widest text-text-secondary uppercase">
          Latencia media por hora
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          Últimas {hours} h · milisegundos
        </p>
      </div>

      <div
        ref={containerRef}
        className="relative"
        style={{ height: HEIGHT }}
        onPointerMove={(event) => setActiveIndex(findNearest(event.clientX))}
        onPointerLeave={() => setActiveIndex(null)}
      >
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Latencia media por hora durante las últimas ${hours} horas. Los valores exactos están en la tabla siguiente.`}
          tabIndex={0}
          className="outline-none focus-visible:ring-2 focus-visible:ring-series-1"
          onFocus={() => setActiveIndex(points.length - 1)}
          onBlur={() => setActiveIndex(null)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault();
              setActiveIndex((current) => {
                const base = current ?? points.length - 1;
                const next = event.key === 'ArrowLeft' ? base - 1 : base + 1;
                return Math.min(Math.max(next, 0), points.length - 1);
              });
            }
          }}
        >
          {/* Grid: hairline solido, un paso off-surface, recesivo */}
          {ticks.map((tick) => {
            const y = PADDING.top + PLOT_HEIGHT - (tick / maxLatency) * PLOT_HEIGHT;
            return (
              <g key={tick}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={PADDING.left + plotWidth}
                  y2={y}
                  stroke="var(--gridline)"
                  strokeWidth={1}
                />
                <text
                  x={PADDING.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="tabular"
                  fontSize={11}
                  fill="var(--text-muted)"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          <line
            x1={PADDING.left}
            y1={baseline}
            x2={PADDING.left + plotWidth}
            y2={baseline}
            stroke="var(--axis)"
            strokeWidth={1}
          />

          {/* Relleno degradado bajo la curva: densidad sin tapar la rejilla */}
          <defs>
            <linearGradient id="latency-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
            </linearGradient>
          </defs>

          {areaPath && <path d={areaPath} fill="url(#latency-area)" />}

          {/* Halo suave bajo el trazo, a juego con el glow del resto del tema */}
          <path
            d={linePath}
            fill="none"
            stroke="var(--series-1)"
            strokeWidth={8}
            strokeOpacity={0.18}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={linePath}
            fill="none"
            stroke="var(--series-1)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Etiqueta directa solo en el extremo, nunca en cada punto */}
          <circle cx={last.x} cy={last.y} r={6} fill="#0a0d1c" />
          <circle cx={last.x} cy={last.y} r={4} fill="var(--series-1)" />

          {/* Ticks de tiempo: primero y ultimo, para no saturar el eje */}
          <text
            x={points[0].x}
            y={HEIGHT - 8}
            textAnchor="start"
            className="tabular"
            fontSize={11}
            fill="var(--text-muted)"
          >
            {new Date(points[0].time).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </text>
          {points.length > 1 && (
            <text
              x={last.x}
              y={HEIGHT - 8}
              textAnchor="end"
              className="tabular"
              fontSize={11}
              fill="var(--text-muted)"
            >
              {new Date(last.time).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </text>
          )}

          {/* Crosshair: encuentra la X, el lector apunta a una hora */}
          {active && (
            <>
              <line
                x1={active.x}
                y1={PADDING.top}
                x2={active.x}
                y2={baseline}
                stroke="var(--axis)"
                strokeWidth={1}
              />
              <circle cx={active.x} cy={active.y} r={6} fill="#0a0d1c" />
              <circle cx={active.x} cy={active.y} r={4} fill="var(--series-1)" />
            </>
          )}
        </svg>

        {active && (
          <div
            className="glass-strong pointer-events-none absolute z-10 rounded-xl px-3 py-2"
            style={{
              left: Math.min(Math.max(active.x - 60, 0), Math.max(width - 150, 0)),
              // Se coloca encima del punto dejando aire; si no cabe arriba,
              // baja debajo en vez de taparlo.
              top:
                active.y - TOOLTIP_HEIGHT - 12 >= 0
                  ? active.y - TOOLTIP_HEIGHT - 12
                  : active.y + 14,
            }}
          >
            {/* El valor lidera; la etiqueta de serie va secundaria */}
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-0.5 w-3 rounded-full"
                style={{ background: 'var(--series-1)' }}
              />
              <span className="tabular text-sm font-semibold text-text-primary">
                {formatLatency(active.latency)}
              </span>
            </div>
            <div className="mt-0.5 text-xs text-text-secondary">
              {new Date(active.time).toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <div className="text-xs text-text-muted">
              {active.stat.successChecks}/{active.stat.totalChecks} checks OK
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

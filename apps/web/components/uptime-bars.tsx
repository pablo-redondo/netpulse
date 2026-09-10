import type { HourlyStat } from '@netpulse/shared-types';

/**
 * Barra de disponibilidad por hora: un segmento por bucket horario, coloreado
 * segun el porcentaje de exito de esa hora. Es el idioma clasico de las
 * paginas de estado.
 *
 * El color aqui va solo, pero no carga informacion exclusiva: el estado
 * actual del servicio ya viene con icono y etiqueta justo encima, el
 * porcentaje agregado esta en cifra al lado, y la pagina de detalle trae la
 * misma serie en tabla. Cada segmento lleva ademas su `title` nativo.
 */
function colorFor(stat: HourlyStat | null): string {
  if (!stat || stat.totalChecks === 0) return 'var(--gridline)';
  const percent = (stat.successChecks / stat.totalChecks) * 100;
  // Las horas sanas van en verde atenuado y las rotas a plena saturacion:
  // en un panel donde casi todo esta bien, pintar lo sano en neon convierte
  // la pantalla en un muro verde donde los fallos se pierden.
  if (percent >= 99.5) return 'var(--status-good-dim)';
  if (percent >= 95) return 'var(--status-warning)';
  return 'var(--status-critical)';
}

export function UptimeBars({ stats, label }: { stats: HourlyStat[]; label: string }) {
  // Nos quedamos con las ultimas 24 lecturas: mas segmentos que eso en el
  // ancho de una tarjeta se convierten en ruido de un pixel.
  const shown = stats.slice(-24);
  if (shown.length === 0) {
    return (
      <div className="h-7 w-full rounded-[1px]" style={{ background: 'var(--gridline)' }} />
    );
  }

  return (
    <div
      className="flex h-7 w-full items-stretch gap-[2px]"
      role="img"
      aria-label={`${label}: disponibilidad de las últimas ${shown.length} horas. Los valores exactos están en la tabla de la página de detalle.`}
    >
      {shown.map((stat) => {
        const percent =
          stat.totalChecks > 0 ? (stat.successChecks / stat.totalChecks) * 100 : null;
        return (
          <span
            key={stat.id}
            className="flex-1 rounded-[2px] transition-transform duration-150 hover:scale-y-110"
            style={{ background: colorFor(stat) }}
            title={`${new Date(stat.hourBucket).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })} — ${percent === null ? 'sin datos' : `${percent.toFixed(1)}%`}`}
          />
        );
      })}
    </div>
  );
}

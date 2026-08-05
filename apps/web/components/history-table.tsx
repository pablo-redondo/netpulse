import type { HourlyStat } from '@netpulse/shared-types';
import { formatLatency, formatUptime } from '@/lib/format';

/**
 * Gemelo tabular de la grafica de latencia: los mismos datos por hora, sin
 * depender del hover ni del color. La grafica nunca es la unica via para
 * leer un valor.
 */
export function HistoryTable({ stats }: { stats: HourlyStat[] }) {
  if (stats.length === 0) return null;

  return (
    <details className="rounded-lg border border-hairline bg-surface-1">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-text-primary">
        Ver los datos en tabla
      </summary>
      <div className="overflow-x-auto border-t border-hairline">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-text-muted">
              <th className="px-4 py-2 font-medium">Hora</th>
              <th className="px-4 py-2 font-medium">Latencia media</th>
              <th className="px-4 py-2 font-medium">Correctas</th>
              <th className="px-4 py-2 font-medium">Disponibilidad</th>
            </tr>
          </thead>
          <tbody>
            {[...stats].reverse().map((stat) => (
              <tr key={stat.id} className="border-t border-hairline">
                <td className="tabular px-4 py-2 text-text-secondary">
                  {new Date(stat.hourBucket).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="tabular px-4 py-2 text-text-primary">
                  {formatLatency(stat.avgLatencyMs)}
                </td>
                <td className="tabular px-4 py-2 text-text-secondary">
                  {stat.successChecks} / {stat.totalChecks}
                </td>
                <td className="tabular px-4 py-2 text-text-secondary">
                  {formatUptime((stat.successChecks / stat.totalChecks) * 100)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

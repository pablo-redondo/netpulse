import type { CheckResult } from '@netpulse/shared-types';
import { formatDateTime, formatLatency } from '@/lib/format';
import { StatusBadge } from '@/components/status-badge';

/** Detalle crudo: la unica vista donde se lee el mensaje de error de un fallo. */
export function ChecksTable({ checks }: { checks: CheckResult[] }) {
  if (checks.length === 0) {
    return (
      <div className="rounded-lg border border-hairline bg-surface-1 p-6 text-sm text-text-muted">
        Todavía no se ha registrado ninguna comprobación.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-hairline bg-surface-1">
      <h2 className="px-4 py-3 text-sm font-medium text-text-primary">
        Últimas comprobaciones
      </h2>
      <div className="overflow-x-auto border-t border-hairline">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-text-muted">
              <th className="px-4 py-2 font-medium">Momento</th>
              <th className="px-4 py-2 font-medium">Resultado</th>
              <th className="px-4 py-2 font-medium">Latencia</th>
              <th className="px-4 py-2 font-medium">Código</th>
              <th className="px-4 py-2 font-medium">Info técnica</th>
              <th className="px-4 py-2 font-medium">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((check) => (
              <tr key={check.id} className="border-t border-hairline">
                <td className="tabular whitespace-nowrap px-4 py-2 text-text-secondary">
                  {formatDateTime(check.timestamp)}
                </td>
                <td className="px-4 py-2">
                  <StatusBadge state={check.success ? 'up' : 'down'} />
                </td>
                <td className="tabular px-4 py-2 text-text-primary">
                  {formatLatency(check.latencyMs)}
                </td>
                <td className="tabular px-4 py-2 text-text-secondary">
                  {check.statusCode ?? '—'}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-text-secondary">
                  {check.details ?? '—'}
                </td>
                <td className="px-4 py-2 text-text-muted">{check.errorMessage ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

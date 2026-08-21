import type { CheckResult } from '@netpulse/shared-types';
import { formatDateTime, formatLatency } from '@/lib/format';
import { Panel } from '@/components/panel';
import { StatusChip } from '@/components/status-badge';

/** Detalle crudo: la unica vista donde se lee el mensaje de error de un fallo. */
export function ChecksTable({ checks }: { checks: CheckResult[] }) {
  if (checks.length === 0) {
    return (
      <Panel title="Últimas comprobaciones">
        <p className="text-sm text-text-muted">
          Todavía no se ha registrado ninguna comprobación.
        </p>
      </Panel>
    );
  }

  return (
    <Panel
      title="Últimas comprobaciones"
      meta={`${checks.length} registros`}
      bodyClassName=""
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] tracking-widest text-text-muted uppercase">
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
              <tr
                key={check.id}
                className="border-t border-hairline transition-colors hover:bg-surface-2"
              >
                <td className="tabular whitespace-nowrap px-4 py-2 text-text-secondary">
                  {formatDateTime(check.timestamp)}
                </td>
                <td className="px-4 py-2">
                  <StatusChip state={check.success ? 'up' : 'down'} />
                </td>
                <td className="tabular px-4 py-2 text-text-primary">
                  {formatLatency(check.latencyMs)}
                </td>
                <td className="tabular px-4 py-2 text-text-secondary">
                  {check.statusCode ?? '—'}
                </td>
                <td className="px-4 py-2 text-xs text-text-secondary">
                  {check.details ?? '—'}
                </td>
                <td className="px-4 py-2 text-xs text-text-muted">
                  {check.errorMessage ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

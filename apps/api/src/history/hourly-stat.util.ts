export interface HourlyStatAccumulator {
  totalChecks: number;
  successChecks: number;
  latencyChecks: number;
  avgLatencyMs: number | null;
}

const EMPTY: HourlyStatAccumulator = {
  totalChecks: 0,
  successChecks: 0,
  latencyChecks: 0,
  avgLatencyMs: null,
};

/**
 * Pliega una comprobacion mas sobre el agregado horario existente. Es pura
 * a proposito: la media ponderada incremental es la aritmetica mas delicada
 * del proyecto (ver el bug de latencyChecks en el README) y aislarla de
 * Prisma es lo que permite testearla sin una base de datos real.
 *
 * El denominador de avgLatencyMs es latencyChecks, no totalChecks: una
 * comprobacion que falla sin llegar a medir nada (un timeout) suma al total
 * pero no tiene latencia que promediar, y meterla en el divisor hundiria la
 * media de las que si midieron.
 */
export function accumulateHourlyStat(
  existing: HourlyStatAccumulator | null,
  outcome: { success: boolean; latencyMs: number | null },
): HourlyStatAccumulator {
  const base = existing ?? EMPTY;

  const totalChecks = base.totalChecks + 1;
  const successChecks = base.successChecks + (outcome.success ? 1 : 0);

  if (outcome.latencyMs === null) {
    return {
      totalChecks,
      successChecks,
      latencyChecks: base.latencyChecks,
      avgLatencyMs: base.avgLatencyMs,
    };
  }

  const latencyChecks = base.latencyChecks + 1;
  const avgLatencyMs =
    ((base.avgLatencyMs ?? 0) * base.latencyChecks + outcome.latencyMs) /
    latencyChecks;

  return { totalChecks, successChecks, latencyChecks, avgLatencyMs };
}

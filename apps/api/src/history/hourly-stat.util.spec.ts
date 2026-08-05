import {
  accumulateHourlyStat,
  type HourlyStatAccumulator,
} from './hourly-stat.util';

describe('accumulateHourlyStat', () => {
  it('parte de cero cuando no hay agregado previo', () => {
    const result = accumulateHourlyStat(null, {
      success: true,
      latencyMs: 100,
    });

    expect(result).toEqual({
      totalChecks: 1,
      successChecks: 1,
      latencyChecks: 1,
      avgLatencyMs: 100,
    });
  });

  it('calcula la media simple cuando todas las comprobaciones tienen latencia', () => {
    let stat: HourlyStatAccumulator | null = null;
    for (const latencyMs of [100, 200, 300]) {
      stat = accumulateHourlyStat(stat, { success: true, latencyMs });
    }

    expect(stat).toEqual({
      totalChecks: 3,
      successChecks: 3,
      latencyChecks: 3,
      avgLatencyMs: 200,
    });
  });

  it('no deja que un timeout sin latencia hunda la media (caso real del bug corregido)', () => {
    let stat: HourlyStatAccumulator | null = null;
    for (const latencyMs of [100, 200, null, 300]) {
      stat = accumulateHourlyStat(stat, {
        success: latencyMs !== null,
        latencyMs,
      });
    }

    // Con el bug original (dividir entre totalChecks) esto daba 187.5.
    expect(stat!.avgLatencyMs).toBe(200);
    expect(stat!.totalChecks).toBe(4);
    expect(stat!.latencyChecks).toBe(3);
    expect(stat!.successChecks).toBe(3);
  });

  it('deja avgLatencyMs en null si ninguna comprobacion ha medido nunca latencia', () => {
    let stat: HourlyStatAccumulator | null = null;
    stat = accumulateHourlyStat(stat, { success: false, latencyMs: null });
    stat = accumulateHourlyStat(stat, { success: false, latencyMs: null });

    expect(stat).toEqual({
      totalChecks: 2,
      successChecks: 0,
      latencyChecks: 0,
      avgLatencyMs: null,
    });
  });

  it('cuenta un fallo con latencia (ej. HTTP 500) en latencyChecks pero no en successChecks', () => {
    const result = accumulateHourlyStat(null, {
      success: false,
      latencyMs: 80,
    });

    expect(result).toEqual({
      totalChecks: 1,
      successChecks: 0,
      latencyChecks: 1,
      avgLatencyMs: 80,
    });
  });

  it('mantiene la media anterior intacta cuando la nueva comprobacion no aporta latencia', () => {
    let stat: HourlyStatAccumulator | null = null;
    stat = accumulateHourlyStat(stat, { success: true, latencyMs: 50 });
    stat = accumulateHourlyStat(stat, { success: false, latencyMs: null });

    expect(stat.avgLatencyMs).toBe(50);
    expect(stat.totalChecks).toBe(2);
    expect(stat.latencyChecks).toBe(1);
  });

  it('es una funcion pura: no muta el acumulador que recibe', () => {
    const previous: HourlyStatAccumulator = {
      totalChecks: 1,
      successChecks: 1,
      latencyChecks: 1,
      avgLatencyMs: 100,
    };
    const snapshot = { ...previous };

    accumulateHourlyStat(previous, { success: true, latencyMs: 200 });

    expect(previous).toEqual(snapshot);
  });
});

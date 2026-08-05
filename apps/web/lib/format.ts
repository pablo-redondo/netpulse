import type { CheckResult } from '@netpulse/shared-types';

export type ServiceState = 'up' | 'unstable' | 'down' | 'unknown';

// Umbral por debajo del cual un servicio que ahora responde se considera
// inestable: sigue en pie, pero ha fallado lo suficiente en la ventana como
// para que decir "Operativo" a secas fuese enganoso.
const UNSTABLE_UPTIME_THRESHOLD = 99;

export function stateOf(
  latest: CheckResult | null,
  uptimePercent: number | null = null,
): ServiceState {
  if (!latest) return 'unknown';
  if (!latest.success) return 'down';
  if (uptimePercent !== null && uptimePercent < UNSTABLE_UPTIME_THRESHOLD) {
    return 'unstable';
  }
  return 'up';
}

export function formatLatency(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatUptime(percent: number | null): string {
  if (percent === null) return '—';
  // Dos decimales solo cuando aportan: 100% y 0% se leen mejor enteros.
  if (percent === 100 || percent === 0) return `${percent}%`;
  return `${percent.toFixed(2)}%`;
}

export function formatHour(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatRelative(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `hace ${seconds}s`;
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
  return `hace ${Math.floor(seconds / 86400)} d`;
}

// El seed guarda el rango CIDR ilustrativo dentro del nombre del grupo,
// ej. "VLAN 10 - Web (10.0.10.0/24)".
export function splitVlanGroup(vlanGroup: string): {
  label: string;
  cidr: string | null;
} {
  const match = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(vlanGroup);
  if (!match) return { label: vlanGroup, cidr: null };
  return { label: match[1], cidr: match[2] };
}

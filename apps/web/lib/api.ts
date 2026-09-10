import type {
  CheckResult,
  HourlyStat,
  Incident,
  MonitoredService,
  UptimeSummary,
} from '@netpulse/shared-types';

const API_URL = process.env.NETPULSE_API_URL ?? 'http://localhost:3001';

// El backend vive en un proceso persistente (Render/Railway). En planes con
// cold-start la primera peticion tras un periodo inactivo puede tardar
// bastante, asi que damos margen y reintentamos una vez antes de rendirnos.
const FIRST_TRY_TIMEOUT_MS = 8_000;
const RETRY_TIMEOUT_MS = 30_000;

export class ApiUnavailableError extends Error {
  constructor(cause: unknown) {
    super('No se pudo contactar con la API de NetPulse');
    this.name = 'ApiUnavailableError';
    this.cause = cause;
  }
}

async function getJson<T>(path: string): Promise<T> {
  let lastError: unknown;

  for (const timeoutMs of [FIRST_TRY_TIMEOUT_MS, RETRY_TIMEOUT_MS]) {
    try {
      const response = await fetch(`${API_URL}${path}`, {
        signal: AbortSignal.timeout(timeoutMs),
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
    }
  }

  throw new ApiUnavailableError(lastError);
}

export function getServices(): Promise<MonitoredService[]> {
  return getJson<MonitoredService[]>('/services');
}

export function getService(id: string): Promise<MonitoredService> {
  return getJson<MonitoredService>(`/services/${id}`);
}

export function getStatus(id: string): Promise<CheckResult | null> {
  return getJson<CheckResult | null>(`/services/${id}/status`);
}

export function getUptime(id: string, hours = 24): Promise<UptimeSummary> {
  return getJson<UptimeSummary>(`/services/${id}/uptime?hours=${hours}`);
}

export function getHistory(id: string, hours = 24): Promise<HourlyStat[]> {
  return getJson<HourlyStat[]>(`/services/${id}/history?hours=${hours}`);
}

export function getRecentChecks(id: string, limit = 20): Promise<CheckResult[]> {
  return getJson<CheckResult[]>(`/services/${id}/checks?limit=${limit}`);
}

export function getServiceIncidents(id: string, limit = 20): Promise<Incident[]> {
  return getJson<Incident[]>(`/services/${id}/incidents?limit=${limit}`);
}

export function getRecentIncidents(limit = 20): Promise<Incident[]> {
  return getJson<Incident[]>(`/incidents/recent?limit=${limit}`);
}

export interface ServiceOverview {
  service: MonitoredService;
  latest: CheckResult | null;
  uptime: UptimeSummary;
  history: HourlyStat[];
}

// Una sola petición al backend, que ensambla ahí el overview de todos los
// servicios. Antes esto era "1 + N*3" peticiones hechas desde aquí —listar
// servicios y, por cada uno, status/uptime/history en paralelo—, y con 21
// servicios eso son 64 peticiones en una sola carga de página. Cloudflare
// Workers en el plan free corta a las 50 subpeticiones externas por
// invocación: el dashboard dejaba de cargar con un ApiUnavailableError
// genérico, con el backend sano de verdad. Ver DashboardService en la API.
export function getDashboard(hours = 24): Promise<ServiceOverview[]> {
  return getJson<ServiceOverview[]>(`/dashboard?hours=${hours}`);
}

export interface CheckResult {
  id: string;
  serviceId: string;
  timestamp: string;
  success: boolean;
  latencyMs: number | null;
  statusCode: number | null;
  errorMessage: string | null;
  /** Solo para TLS: fecha de expiración del certificado observado. */
  certExpiresAt: string | null;
}

export interface Incident {
  id: string;
  serviceId: string;
  serviceName: string;
  startedAt: string;
  resolvedAt: string | null;
  cause: string | null;
}

export interface HourlyStat {
  id: string;
  serviceId: string;
  hourBucket: string;
  totalChecks: number;
  successChecks: number;
  /** Comprobaciones que devolvieron latencia: el denominador de avgLatencyMs. */
  latencyChecks: number;
  avgLatencyMs: number | null;
}

export interface UptimeSummary {
  serviceId: string;
  hours: number;
  totalChecks: number;
  successChecks: number;
  uptimePercent: number | null;
}

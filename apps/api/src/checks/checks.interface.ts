import type { CheckType, MonitoredService } from '#prisma/client';

export interface CheckOutcome {
  success: boolean;
  latencyMs: number | null;
  statusCode: number | null;
  errorMessage: string | null;
  /** Solo la produce TlsCheckStrategy. */
  certExpiresAt?: Date | null;
}

export interface CheckStrategy {
  readonly type: CheckType;
  // El segundo argumento solo lo usa HttpCheckStrategy (expectedContent); el
  // resto de estrategias lo ignoran.
  run(
    target: string,
    service?: Pick<MonitoredService, 'expectedContent'>,
  ): Promise<CheckOutcome>;
}

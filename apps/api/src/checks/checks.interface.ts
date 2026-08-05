import type { CheckType } from '#prisma/client';

export interface CheckOutcome {
  success: boolean;
  latencyMs: number | null;
  statusCode: number | null;
  errorMessage: string | null;
}

export interface CheckStrategy {
  readonly type: CheckType;
  run(target: string): Promise<CheckOutcome>;
}

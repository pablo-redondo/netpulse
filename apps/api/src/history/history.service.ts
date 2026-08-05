import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CheckOutcome } from '../checks/checks.interface';

function startOfHour(date: Date): Date {
  const truncated = new Date(date);
  truncated.setMinutes(0, 0, 0);
  return truncated;
}

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async record(serviceId: string, outcome: CheckOutcome): Promise<void> {
    const hourBucket = startOfHour(new Date());

    await this.prisma.$transaction(async (tx) => {
      await tx.checkResult.create({
        data: {
          serviceId,
          success: outcome.success,
          latencyMs: outcome.latencyMs,
          statusCode: outcome.statusCode,
          errorMessage: outcome.errorMessage,
        },
      });

      const existing = await tx.hourlyStat.findUnique({
        where: { serviceId_hourBucket: { serviceId, hourBucket } },
      });

      const totalChecks = (existing?.totalChecks ?? 0) + 1;
      const successChecks =
        (existing?.successChecks ?? 0) + (outcome.success ? 1 : 0);
      // Media ponderada incremental sobre las comprobaciones con latencia
      // conocida; las que fallan sin latencia (ej. timeout) no aportan al
      // numerador pero si al denominador de totalChecks.
      const avgLatencyMs =
        outcome.latencyMs === null
          ? (existing?.avgLatencyMs ?? null)
          : ((existing?.avgLatencyMs ?? 0) * (existing?.totalChecks ?? 0) +
              outcome.latencyMs) /
            totalChecks;

      await tx.hourlyStat.upsert({
        where: { serviceId_hourBucket: { serviceId, hourBucket } },
        create: {
          serviceId,
          hourBucket,
          totalChecks,
          successChecks,
          avgLatencyMs,
        },
        update: { totalChecks, successChecks, avgLatencyMs },
      });
    });
  }
}

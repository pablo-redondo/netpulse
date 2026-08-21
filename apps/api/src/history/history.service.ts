import { Injectable } from '@nestjs/common';
import type {
  CheckResult,
  HourlyStat,
  UptimeSummary,
} from '@netpulse/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import type { CheckOutcome } from '../checks/checks.interface';
import type {
  CheckResult as CheckResultEntity,
  HourlyStat as HourlyStatEntity,
} from '#prisma/client';
import { accumulateHourlyStat } from './hourly-stat.util';

function startOfHour(date: Date): Date {
  const truncated = new Date(date);
  truncated.setMinutes(0, 0, 0);
  return truncated;
}

function toCheckResultDto(result: CheckResultEntity): CheckResult {
  return {
    ...result,
    timestamp: result.timestamp.toISOString(),
    certExpiresAt: result.certExpiresAt?.toISOString() ?? null,
  };
}

function toHourlyStatDto(stat: HourlyStatEntity): HourlyStat {
  return { ...stat, hourBucket: stat.hourBucket.toISOString() };
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
          certExpiresAt: outcome.certExpiresAt ?? null,
        },
      });

      const existing = await tx.hourlyStat.findUnique({
        where: { serviceId_hourBucket: { serviceId, hourBucket } },
      });

      const { totalChecks, successChecks, latencyChecks, avgLatencyMs } =
        accumulateHourlyStat(existing, outcome);

      await tx.hourlyStat.upsert({
        where: { serviceId_hourBucket: { serviceId, hourBucket } },
        create: {
          serviceId,
          hourBucket,
          totalChecks,
          successChecks,
          latencyChecks,
          avgLatencyMs,
        },
        update: { totalChecks, successChecks, latencyChecks, avgLatencyMs },
      });
    });
  }

  async getLatestResult(serviceId: string): Promise<CheckResult | null> {
    const result = await this.prisma.checkResult.findFirst({
      where: { serviceId },
      orderBy: { timestamp: 'desc' },
    });
    return result ? toCheckResultDto(result) : null;
  }

  // Detalle reciente sobre CheckResult en crudo: es la unica vista donde se
  // ve el errorMessage de cada fallo. Acotado por limit para no crecer con
  // el historico.
  async getRecentResults(
    serviceId: string,
    limit: number,
  ): Promise<CheckResult[]> {
    const results = await this.prisma.checkResult.findMany({
      where: { serviceId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
    return results.map(toCheckResultDto);
  }

  // Agrega sobre HourlyStat (no CheckResult) para calcular el uptime sin
  // escanear cada comprobacion individual.
  async getUptime(serviceId: string, hours: number): Promise<UptimeSummary> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const { _sum } = await this.prisma.hourlyStat.aggregate({
      where: { serviceId, hourBucket: { gte: since } },
      _sum: { totalChecks: true, successChecks: true },
    });

    const totalChecks = _sum.totalChecks ?? 0;
    const successChecks = _sum.successChecks ?? 0;
    const uptimePercent =
      totalChecks > 0 ? (successChecks / totalChecks) * 100 : null;

    return { serviceId, hours, totalChecks, successChecks, uptimePercent };
  }

  async getLatencyHistory(
    serviceId: string,
    hours: number,
  ): Promise<HourlyStat[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const stats = await this.prisma.hourlyStat.findMany({
      where: { serviceId, hourBucket: { gte: since } },
      orderBy: { hourBucket: 'asc' },
    });
    return stats.map(toHourlyStatDto);
  }
}

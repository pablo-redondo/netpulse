import { Injectable } from '@nestjs/common';
import type { Incident } from '@netpulse/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { CheckOutcome } from '../checks/checks.interface';
import type { Incident as IncidentEntity } from '#prisma/client';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function toDto(
  incident: IncidentEntity & { service: { name: string } },
): Incident {
  return {
    id: incident.id,
    serviceId: incident.serviceId,
    serviceName: incident.service.name,
    startedAt: incident.startedAt.toISOString(),
    resolvedAt: incident.resolvedAt?.toISOString() ?? null,
    cause: incident.cause,
  };
}

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}min`;
}

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // Abre un incidente en el primer fallo tras un tramo sano, y lo resuelve
  // en el primer exito tras un tramo caido. Llamadas repetidas en el mismo
  // estado (fallo tras fallo, exito tras exito) no hacen nada.
  async recordOutcome(
    service: { id: string; name: string },
    outcome: CheckOutcome,
  ): Promise<void> {
    const open = await this.prisma.incident.findFirst({
      where: { serviceId: service.id, resolvedAt: null },
    });

    if (!outcome.success) {
      if (!open) {
        await this.prisma.incident.create({
          data: {
            serviceId: service.id,
            cause: outcome.errorMessage,
          },
        });
        await this.notifications.sendAlert(
          `🔴 ${service.name} no responde${outcome.errorMessage ? `: ${outcome.errorMessage}` : ''}`,
        );
      }
      return;
    }

    if (open) {
      const resolvedAt = new Date();
      await this.prisma.incident.update({
        where: { id: open.id },
        data: { resolvedAt },
      });
      const duration = formatDuration(
        resolvedAt.getTime() - open.startedAt.getTime(),
      );
      await this.notifications.sendAlert(
        `🟢 ${service.name} se ha recuperado (caída de ${duration})`,
      );
    }
  }

  async listForService(serviceId: string, limit = DEFAULT_LIMIT) {
    const incidents = await this.prisma.incident.findMany({
      where: { serviceId },
      include: { service: { select: { name: true } } },
      orderBy: { startedAt: 'desc' },
      take: Math.min(limit, MAX_LIMIT),
    });
    return incidents.map(toDto);
  }

  async listRecent(limit = DEFAULT_LIMIT) {
    const incidents = await this.prisma.incident.findMany({
      include: { service: { select: { name: true } } },
      orderBy: { startedAt: 'desc' },
      take: Math.min(limit, MAX_LIMIT),
    });
    return incidents.map(toDto);
  }
}

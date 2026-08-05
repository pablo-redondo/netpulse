import { Injectable, NotFoundException } from '@nestjs/common';
import type { MonitoredService as MonitoredServiceDto } from '@netpulse/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import type { MonitoredService as MonitoredServiceEntity } from '#prisma/client';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<MonitoredServiceDto[]> {
    const services = await this.prisma.monitoredService.findMany({
      orderBy: { name: 'asc' },
    });
    return services.map(toDto);
  }

  // Usado por el scheduler (Paso 2), no expuesto vía controller.
  findAllActive() {
    return this.prisma.monitoredService.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<MonitoredServiceDto> {
    const service = await this.prisma.monitoredService.findUnique({
      where: { id },
    });
    if (!service) {
      throw new NotFoundException(`Service ${id} not found`);
    }
    return toDto(service);
  }
}

function toDto(service: MonitoredServiceEntity): MonitoredServiceDto {
  return {
    ...service,
    createdAt: service.createdAt.toISOString(),
  };
}

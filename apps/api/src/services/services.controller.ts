import { Controller, Get, Param } from '@nestjs/common';
import type { MonitoredService } from '@netpulse/shared-types';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  findAll(): Promise<MonitoredService[]> {
    return this.servicesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<MonitoredService> {
    return this.servicesService.findOne(id);
  }
}

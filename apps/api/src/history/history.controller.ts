import { Controller, Get, Param, Query } from '@nestjs/common';
import { ServicesService } from '../services/services.service';
import { HistoryService } from './history.service';

const DEFAULT_HOURS = 24;
const MAX_HOURS = 720; // 30 dias

function parseHours(hoursParam?: string): number {
  const parsed = Number(hoursParam);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_HOURS;
  }
  return Math.min(parsed, MAX_HOURS);
}

@Controller('services/:id')
export class HistoryController {
  constructor(
    private readonly historyService: HistoryService,
    private readonly servicesService: ServicesService,
  ) {}

  @Get('status')
  async getStatus(@Param('id') id: string) {
    await this.servicesService.findOne(id);
    return this.historyService.getLatestResult(id);
  }

  @Get('uptime')
  async getUptime(
    @Param('id') id: string,
    @Query('hours') hoursParam?: string,
  ) {
    await this.servicesService.findOne(id);
    return this.historyService.getUptime(id, parseHours(hoursParam));
  }

  @Get('history')
  async getHistory(
    @Param('id') id: string,
    @Query('hours') hoursParam?: string,
  ) {
    await this.servicesService.findOne(id);
    return this.historyService.getLatencyHistory(id, parseHours(hoursParam));
  }
}

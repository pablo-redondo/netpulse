import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ServicesService } from '../services/services.service';
import { HistoryService } from './history.service';

const DEFAULT_HOURS = 24;
const MAX_HOURS = 720; // 30 dias
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parseHours(hoursParam?: string): number {
  const parsed = Number(hoursParam);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_HOURS;
  }
  return Math.min(parsed, MAX_HOURS);
}

function parseLimit(limitParam?: string): number {
  const parsed = Number(limitParam);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.floor(parsed), MAX_LIMIT);
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

  @Get('checks')
  async getChecks(
    @Param('id') id: string,
    @Query('limit') limitParam?: string,
  ) {
    await this.servicesService.findOne(id);
    return this.historyService.getRecentResults(id, parseLimit(limitParam));
  }

  @Get('history.csv')
  async exportHistoryCsv(
    @Param('id') id: string,
    @Query('hours') hoursParam: string | undefined,
    @Res() res: Response,
  ) {
    const service = await this.servicesService.findOne(id);
    const hours = parseHours(hoursParam);
    const stats = await this.historyService.getLatencyHistory(id, hours);

    const header =
      'hourBucket,totalChecks,successChecks,uptimePercent,avgLatencyMs';
    const rows = stats.map((stat) => {
      const uptimePercent =
        stat.totalChecks > 0
          ? ((stat.successChecks / stat.totalChecks) * 100).toFixed(2)
          : '';
      const avgLatencyMs = stat.avgLatencyMs?.toFixed(1) ?? '';
      return `${stat.hourBucket},${stat.totalChecks},${stat.successChecks},${uptimePercent},${avgLatencyMs}`;
    });
    const csv = [header, ...rows].join('\n');

    const filename = `${service.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-history.csv`;
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}

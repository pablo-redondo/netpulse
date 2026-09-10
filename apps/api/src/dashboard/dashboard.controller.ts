import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

const DEFAULT_HOURS = 24;
const MAX_HOURS = 720; // 30 dias

function parseHours(hoursParam?: string): number {
  const parsed = Number(hoursParam);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_HOURS;
  }
  return Math.min(parsed, MAX_HOURS);
}

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getOverview(@Query('hours') hoursParam?: string) {
    return this.dashboardService.getOverview(parseHours(hoursParam));
  }
}

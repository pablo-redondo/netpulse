import { Controller, Get, Param, Query } from '@nestjs/common';
import { ServicesService } from '../services/services.service';
import { IncidentsService } from './incidents.service';

const DEFAULT_LIMIT = 20;

function parseLimit(limitParam?: string): number | undefined {
  const parsed = Number(limitParam);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined;
}

@Controller()
export class IncidentsController {
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly servicesService: ServicesService,
  ) {}

  @Get('services/:id/incidents')
  async listForService(
    @Param('id') id: string,
    @Query('limit') limitParam?: string,
  ) {
    await this.servicesService.findOne(id);
    return this.incidentsService.listForService(
      id,
      parseLimit(limitParam) ?? DEFAULT_LIMIT,
    );
  }

  @Get('incidents/recent')
  listRecent(@Query('limit') limitParam?: string) {
    return this.incidentsService.listRecent(
      parseLimit(limitParam) ?? DEFAULT_LIMIT,
    );
  }
}

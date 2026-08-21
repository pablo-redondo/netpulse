import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ChecksService } from '../checks/checks.service';
import { HistoryService } from '../history/history.service';
import { ServicesService } from '../services/services.service';
import { IncidentsService } from '../incidents/incidents.service';

const CHECK_INTERVAL_NAME = 'monitored-services-check';
const DEFAULT_INTERVAL_MS = 300_000;

@Injectable()
export class ScheduleService implements OnModuleInit {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
    private readonly servicesService: ServicesService,
    private readonly checksService: ChecksService,
    private readonly historyService: HistoryService,
    private readonly incidentsService: IncidentsService,
  ) {}

  onModuleInit() {
    const intervalMs =
      Number(this.configService.get('CHECK_INTERVAL_MS')) ||
      DEFAULT_INTERVAL_MS;
    const interval = setInterval(() => void this.runChecks(), intervalMs);
    this.schedulerRegistry.addInterval(CHECK_INTERVAL_NAME, interval);
    this.logger.log(`Scheduler started, checking every ${intervalMs}ms`);

    void this.runChecks();
  }

  private async runChecks(): Promise<void> {
    const services = await this.servicesService.findAllActive();

    const results = await Promise.allSettled(
      services.map(async (service) => {
        const outcome = await this.checksService.execute(service);
        await this.historyService.record(service.id, outcome);
        await this.incidentsService.recordOutcome(service, outcome);
        return outcome;
      }),
    );

    const failed = results.filter((result) => result.status === 'rejected');
    if (failed.length > 0) {
      this.logger.warn(
        `${failed.length}/${services.length} checks failed unexpectedly`,
      );
    }
    this.logger.log(`Ran ${results.length} checks`);
  }
}

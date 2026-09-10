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

  // Una ronda nunca puede tumbar el proceso. El `Promise.allSettled` de abajo
  // aisla el fallo de un servicio concreto, pero todo lo que queda fuera de el
  // —leer la lista de servicios— se ejecuta contra la base de datos: si esta
  // no responde, la promesa rechazaba, nadie la capturaba (las dos llamadas
  // son `void this.runChecks()`) y Node mataba el proceso por unhandled
  // rejection. En Render eso se traducia en un bucle de reinicio que se
  // llevaba por delante tambien los endpoints de lectura y el health check.
  // Ahora se registra el error y el intervalo sigue vivo para reintentarlo.
  private async runChecks(): Promise<void> {
    try {
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
    } catch (error) {
      this.logger.error(
        `La ronda de comprobaciones falló entera (¿base de datos inaccesible?): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

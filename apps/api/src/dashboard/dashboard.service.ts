import { Injectable } from '@nestjs/common';
import type {
  CheckResult,
  HourlyStat,
  MonitoredService,
  UptimeSummary,
} from '@netpulse/shared-types';
import { ServicesService } from '../services/services.service';
import { HistoryService } from '../history/history.service';

export interface ServiceOverview {
  service: MonitoredService;
  latest: CheckResult | null;
  uptime: UptimeSummary;
  history: HourlyStat[];
}

// Ensambla en el servidor lo que antes montaba el frontend con 1 + N*3
// peticiones HTTP (una por servicio y comprobación). Aqui cada servicio es
// una consulta directa a la base de datos, no una peticion de red, asi que
// componer 21 servicios cuesta lo mismo que componer 5: nada relevante.
//
// Existe porque ese patron N+1 reventaba el limite de 50 subpeticiones
// externas por invocacion del plan free de Cloudflare Workers en cuanto el
// catalogo paso de ~10 a 21 servicios (1 + 21*3 = 64 > 50): el dashboard
// dejaba de cargar con un ApiUnavailableError generico, con el backend sano
// de verdad. Con este endpoint el frontend hace una unica peticion.
@Injectable()
export class DashboardService {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly historyService: HistoryService,
  ) {}

  async getOverview(hours: number): Promise<ServiceOverview[]> {
    const services = await this.servicesService.findAll();

    return Promise.all(
      services.map(async (service) => {
        const [latest, uptime, history] = await Promise.all([
          this.historyService.getLatestResult(service.id),
          this.historyService.getUptime(service.id, hours),
          this.historyService.getLatencyHistory(service.id, hours),
        ]);
        return { service, latest, uptime, history };
      }),
    );
  }
}

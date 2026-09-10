import type { MonitoredService } from '@netpulse/shared-types';
import { DashboardService } from './dashboard.service';
import type { ServicesService } from '../services/services.service';
import type { HistoryService } from '../history/history.service';

function fakeService(id: string, name: string): MonitoredService {
  return {
    id,
    name,
    type: 'HTTP',
    target: `https://${name.toLowerCase()}`,
    vlanGroup: null,
    expectedContent: null,
    isActive: true,
    createdAt: new Date(0).toISOString(),
  };
}

const SERVICES = [fakeService('a', 'A'), fakeService('b', 'B')];

describe('DashboardService', () => {
  let findAll: jest.Mock;
  let getLatestResult: jest.Mock;
  let getUptime: jest.Mock;
  let getLatencyHistory: jest.Mock;
  let service: DashboardService;

  beforeEach(() => {
    findAll = jest.fn().mockResolvedValue(SERVICES);
    getLatestResult = jest.fn().mockResolvedValue(null);
    getUptime = jest.fn().mockResolvedValue({
      serviceId: 'x',
      hours: 24,
      totalChecks: 0,
      successChecks: 0,
      uptimePercent: null,
    });
    getLatencyHistory = jest.fn().mockResolvedValue([]);

    service = new DashboardService(
      { findAll } as unknown as ServicesService,
      {
        getLatestResult,
        getUptime,
        getLatencyHistory,
      } as unknown as HistoryService,
    );
  });

  it('compone un overview por cada servicio, en una sola llamada del cliente', async () => {
    const result = await service.getOverview(24);

    expect(result).toHaveLength(2);
    expect(result[0].service).toEqual(SERVICES[0]);
    expect(result[0].latest).toBeNull();
    expect(result[0].uptime.hours).toBe(24);
    expect(result[0].history).toEqual([]);
  });

  it('pide el historico de cada servicio con la ventana de horas recibida', async () => {
    await service.getOverview(168);

    expect(getUptime).toHaveBeenCalledWith('a', 168);
    expect(getUptime).toHaveBeenCalledWith('b', 168);
    expect(getLatencyHistory).toHaveBeenCalledWith('a', 168);
    expect(getLatencyHistory).toHaveBeenCalledWith('b', 168);
  });

  it('no hace ninguna consulta de historico si no hay servicios', async () => {
    findAll.mockResolvedValue([]);

    const result = await service.getOverview(24);

    expect(result).toEqual([]);
    expect(getLatestResult).not.toHaveBeenCalled();
  });
});

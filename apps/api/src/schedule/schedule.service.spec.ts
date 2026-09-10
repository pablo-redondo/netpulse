import { Logger } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import type { ConfigService } from '@nestjs/config';
import type { SchedulerRegistry } from '@nestjs/schedule';
import type { ChecksService } from '../checks/checks.service';
import type { HistoryService } from '../history/history.service';
import type { ServicesService } from '../services/services.service';
import type { IncidentsService } from '../incidents/incidents.service';

const OK = {
  success: true,
  latencyMs: 10,
  statusCode: 200,
  errorMessage: null,
};

describe('ScheduleService', () => {
  let intervals: NodeJS.Timeout[];
  let findAllActive: jest.Mock;
  let execute: jest.Mock;
  let record: jest.Mock;
  let recordOutcome: jest.Mock;
  let errorSpy: jest.SpyInstance;
  let service: ScheduleService;

  beforeEach(() => {
    intervals = [];
    findAllActive = jest.fn().mockResolvedValue([]);
    execute = jest.fn().mockResolvedValue(OK);
    record = jest.fn().mockResolvedValue(undefined);
    recordOutcome = jest.fn().mockResolvedValue(undefined);
    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

    service = new ScheduleService(
      {
        addInterval: (_name: string, interval: NodeJS.Timeout) => {
          intervals.push(interval);
        },
      } as unknown as SchedulerRegistry,
      { get: () => '300000' } as unknown as ConfigService,
      { findAllActive } as unknown as ServicesService,
      { execute } as unknown as ChecksService,
      { record } as unknown as HistoryService,
      { recordOutcome } as unknown as IncidentsService,
    );
  });

  afterEach(() => {
    intervals.forEach((interval) => clearInterval(interval));
    jest.restoreAllMocks();
  });

  // Regresion: la base de datos inaccesible hacia rechazar runChecks, y como
  // se invoca con `void`, Node mataba el proceso por unhandled rejection. En
  // Render eso era un bucle de reinicio que tumbaba tambien los endpoints de
  // lectura y el health check.
  it('sobrevive a una base de datos inaccesible en vez de tumbar el proceso', async () => {
    findAllActive.mockRejectedValue(new Error('Can not reach database server'));

    service.onModuleInit();
    // Deja correr la ronda inicial, que se lanza con `void`.
    await new Promise((resolve) => setImmediate(resolve));

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Can not reach database server'),
    );
  });

  it('un servicio que revienta no impide comprobar el resto', async () => {
    findAllActive.mockResolvedValue([
      {
        id: 'a',
        name: 'A',
        type: 'HTTP',
        target: 'https://a',
        expectedContent: null,
      },
      {
        id: 'b',
        name: 'B',
        type: 'HTTP',
        target: 'https://b',
        expectedContent: null,
      },
    ]);
    record.mockRejectedValueOnce(new Error('fallo al persistir'));

    service.onModuleInit();
    await new Promise((resolve) => setImmediate(resolve));

    expect(execute).toHaveBeenCalledTimes(2);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('registra el intervalo con el valor de CHECK_INTERVAL_MS', () => {
    service.onModuleInit();
    expect(intervals).toHaveLength(1);
  });
});

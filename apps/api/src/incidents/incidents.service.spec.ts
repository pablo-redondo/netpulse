import { IncidentsService } from './incidents.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { NotificationsService } from '../notifications/notifications.service';
import type { CheckOutcome } from '../checks/checks.interface';

const SERVICE = { id: 'svc-1', name: 'GitHub' };

function outcome(
  success: boolean,
  errorMessage: string | null = null,
): CheckOutcome {
  return {
    success,
    latencyMs: success ? 42 : null,
    statusCode: null,
    errorMessage,
  };
}

describe('IncidentsService', () => {
  let prisma: {
    incident: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let notifications: { sendAlert: jest.Mock };
  let service: IncidentsService;

  beforeEach(() => {
    prisma = {
      incident: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    notifications = { sendAlert: jest.fn() };
    service = new IncidentsService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
    );
  });

  it('abre un incidente en el primer fallo tras un tramo sano', async () => {
    prisma.incident.findFirst.mockResolvedValue(null);

    await service.recordOutcome(SERVICE, outcome(false, 'timeout'));

    expect(prisma.incident.create).toHaveBeenCalledWith({
      data: { serviceId: 'svc-1', cause: 'timeout' },
    });
    expect(notifications.sendAlert).toHaveBeenCalledWith(
      expect.stringContaining('GitHub'),
    );
  });

  it('no abre un segundo incidente si ya hay uno abierto', async () => {
    prisma.incident.findFirst.mockResolvedValue({
      id: 'inc-1',
      startedAt: new Date(),
    });

    await service.recordOutcome(SERVICE, outcome(false, 'timeout'));

    expect(prisma.incident.create).not.toHaveBeenCalled();
    expect(notifications.sendAlert).not.toHaveBeenCalled();
  });

  it('resuelve el incidente abierto en el primer exito', async () => {
    prisma.incident.findFirst.mockResolvedValue({
      id: 'inc-1',
      startedAt: new Date(Date.now() - 5 * 60 * 1000),
    });

    await service.recordOutcome(SERVICE, outcome(true));

    const [updateArgs] = prisma.incident.update.mock.calls[0] as [
      { where: { id: string }; data: { resolvedAt: Date } },
    ];
    expect(updateArgs.where).toEqual({ id: 'inc-1' });
    expect(updateArgs.data.resolvedAt).toBeInstanceOf(Date);
    expect(notifications.sendAlert).toHaveBeenCalledWith(
      expect.stringContaining('recuperado'),
    );
  });

  it('no hace nada en un exito sin incidente abierto', async () => {
    prisma.incident.findFirst.mockResolvedValue(null);

    await service.recordOutcome(SERVICE, outcome(true));

    expect(prisma.incident.create).not.toHaveBeenCalled();
    expect(prisma.incident.update).not.toHaveBeenCalled();
    expect(notifications.sendAlert).not.toHaveBeenCalled();
  });
});

import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminController } from './admin.controller';
import { seedServices } from './seed-data';
import type { PrismaService } from '../prisma/prisma.service';

const SECRET = 'secreto-de-prueba';

describe('AdminController', () => {
  let prisma: { monitoredService: { upsert: jest.Mock } };
  let controller: AdminController;
  const originalSecret = process.env.SEED_SECRET;

  beforeEach(() => {
    prisma = { monitoredService: { upsert: jest.fn().mockResolvedValue({}) } };
    controller = new AdminController(prisma as unknown as PrismaService);
    process.env.SEED_SECRET = SECRET;
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.SEED_SECRET;
    else process.env.SEED_SECRET = originalSecret;
  });

  it('da 503 si SEED_SECRET no esta configurado, sin tocar la base de datos', async () => {
    delete process.env.SEED_SECRET;

    await expect(controller.seed(`Bearer ${SECRET}`)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(prisma.monitoredService.upsert).not.toHaveBeenCalled();
  });

  it('siembra el catalogo completo con el secreto correcto', async () => {
    const result = await controller.seed(`Bearer ${SECRET}`);

    expect(result).toEqual({ seeded: seedServices.length });
    expect(prisma.monitoredService.upsert).toHaveBeenCalledTimes(
      seedServices.length,
    );
  });

  it('acepta el esquema Bearer sin distinguir mayusculas', async () => {
    await expect(controller.seed(`bearer ${SECRET}`)).resolves.toEqual({
      seeded: seedServices.length,
    });
  });

  it('rechaza un secreto incorrecto', async () => {
    await expect(
      controller.seed('Bearer no-es-el-secreto'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.monitoredService.upsert).not.toHaveBeenCalled();
  });

  it('rechaza cuando no hay cabecera Authorization', async () => {
    await expect(controller.seed(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.monitoredService.upsert).not.toHaveBeenCalled();
  });

  it('rechaza el secreto suelto sin el esquema Bearer', async () => {
    await expect(controller.seed(SECRET)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rechaza otros esquemas de autorizacion', async () => {
    await expect(controller.seed(`Basic ${SECRET}`)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  // El secreto ya no viaja en la URL, asi que un token de longitud distinta
  // no puede colarse por la comparacion en tiempo constante.
  it('rechaza un secreto de longitud distinta sin reventar', async () => {
    await expect(controller.seed('Bearer corto')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('no da de alta ningun target que venga del cliente: el catalogo es fijo', async () => {
    await controller.seed(`Bearer ${SECRET}`);

    const targets = prisma.monitoredService.upsert.mock.calls.map(
      ([args]: [{ create: { target: string } }]) => args.create.target,
    );
    expect(targets).toEqual(seedServices.map((service) => service.target));
  });
});

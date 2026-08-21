import {
  Controller,
  Get,
  Query,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { seedServices } from './seed-data';

// Endpoint temporal de un solo uso: siembra el catalogo de servicios en
// produccion disparando la conexion a la base de datos desde dentro de
// Render, evitando depender de una conexion externa a Postgres. Protegido
// por SEED_SECRET (generado por Render, ver render.yaml) para que no sea
// publico. Es idempotente (upsert), asi que volver a llamarlo tras añadir
// servicios nuevos al catalogo es seguro.
@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('seed')
  async seed(@Query('secret') secret?: string) {
    const expected = process.env.SEED_SECRET;
    if (!expected) {
      throw new ServiceUnavailableException('SEED_SECRET no configurado');
    }
    if (secret !== expected) {
      throw new UnauthorizedException();
    }

    for (const service of seedServices) {
      const expectedContent = service.expectedContent ?? null;
      await this.prisma.monitoredService.upsert({
        where: { name: service.name },
        update: {
          type: service.type,
          target: service.target,
          vlanGroup: service.vlanGroup,
          expectedContent,
          isActive: true,
        },
        create: { ...service, expectedContent },
      });
    }

    return { seeded: seedServices.length };
  }
}

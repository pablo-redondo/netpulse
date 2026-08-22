import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { seedServices } from './seed-data';

// Comparacion en tiempo constante: un `===` sale antes en el primer caracter
// distinto, y esa diferencia de tiempo es medible. La longitud si se filtra
// (no hay forma barata de evitarlo), pero el contenido no.
function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Extrae el secreto de "Authorization: Bearer <token>". Fuera de la URL a
// proposito: una query string acaba en los logs del servidor, en el Referer
// y en el historial del navegador.
function bearerToken(authorization: string | undefined): string | null {
  if (!authorization) return null;
  const match = /^Bearer[ \t]+(.+)$/i.exec(authorization.trim());
  return match ? match[1].trim() : null;
}

// Sembrado del catalogo de servicios en produccion: dispara la conexion a la
// base de datos desde dentro de Render, evitando depender de una conexion
// externa a Postgres (el plan free no da Shell ni Jobs). Protegido por
// SEED_SECRET. Es idempotente (upsert), asi que volver a llamarlo tras añadir
// servicios nuevos al catalogo es seguro.
//
// Es la unica escritura sobre MonitoredService de toda la API, y no acepta
// datos del cliente: el payload es el catalogo fijo de seed-data.ts, de modo
// que ni siquiera con el secreto se puede dar de alta un target arbitrario.
@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('seed')
  // POST devuelve 201 por defecto en Nest; lo fijamos a 200 para no cambiar
  // el codigo de exito al endurecer el endpoint.
  @HttpCode(HttpStatus.OK)
  async seed(@Headers('authorization') authorization?: string) {
    const expected = process.env.SEED_SECRET;
    if (!expected) {
      throw new ServiceUnavailableException('SEED_SECRET no configurado');
    }

    const provided = bearerToken(authorization);
    if (provided === null || !secretMatches(provided, expected)) {
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

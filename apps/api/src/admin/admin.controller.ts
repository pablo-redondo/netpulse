import {
  Controller,
  Get,
  Query,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckType } from '#prisma/client';

// Agrupacion ilustrativa por VLAN, usada solo por la vista de topologia
// (ver DESIGN.md, punto 5). No refleja segmentacion de red real.
const VLAN_WEB = 'VLAN 10 - Web (10.0.10.0/24)';
const VLAN_DNS = 'VLAN 20 - DNS (10.0.20.0/24)';
const VLAN_INFRA = 'VLAN 30 - Infra (10.0.30.0/24)';

const services: Array<{
  name: string;
  type: CheckType;
  target: string;
  vlanGroup: string;
}> = [
  {
    name: 'GitHub',
    type: CheckType.HTTP,
    target: 'https://github.com',
    vlanGroup: VLAN_WEB,
  },
  {
    name: 'Google',
    type: CheckType.HTTP,
    target: 'https://google.com',
    vlanGroup: VLAN_WEB,
  },
  {
    name: 'Cloudflare',
    type: CheckType.HTTP,
    target: 'https://cloudflare.com',
    vlanGroup: VLAN_WEB,
  },
  {
    name: 'GitHub API',
    type: CheckType.HTTP,
    target: 'https://api.github.com',
    vlanGroup: VLAN_WEB,
  },
  {
    name: 'Cloudflare DNS (1.1.1.1)',
    type: CheckType.DNS,
    target: 'github.com@1.1.1.1',
    vlanGroup: VLAN_DNS,
  },
  {
    name: 'Google DNS (8.8.8.8)',
    type: CheckType.DNS,
    target: 'google.com@8.8.8.8',
    vlanGroup: VLAN_DNS,
  },
  {
    name: 'Quad9 DNS (9.9.9.9)',
    type: CheckType.DNS,
    target: 'cloudflare.com@9.9.9.9',
    vlanGroup: VLAN_DNS,
  },
  {
    name: 'GitHub TCP:443',
    type: CheckType.TCP,
    target: 'github.com:443',
    vlanGroup: VLAN_INFRA,
  },
  {
    name: 'Cloudflare DNS TCP:53',
    type: CheckType.TCP,
    target: '1.1.1.1:53',
    vlanGroup: VLAN_INFRA,
  },
  {
    name: 'Gmail SMTP TCP:587',
    type: CheckType.TCP,
    target: 'smtp.gmail.com:587',
    vlanGroup: VLAN_INFRA,
  },
];

// Endpoint temporal de un solo uso: siembra los 10 servicios en produccion
// disparando la conexion a la base de datos desde dentro de Render, evitando
// depender de una conexion externa a Postgres. Protegido por SEED_SECRET
// (generado por Render, ver render.yaml) para que no sea publico.
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

    for (const service of services) {
      await this.prisma.monitoredService.upsert({
        where: { name: service.name },
        update: {
          type: service.type,
          target: service.target,
          vlanGroup: service.vlanGroup,
          isActive: true,
        },
        create: service,
      });
    }

    return { seeded: services.length };
  }
}

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { CheckType, PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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

async function main() {
  for (const service of services) {
    await prisma.monitoredService.upsert({
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
  console.log(`Seed complete: ${services.length} services upserted.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { seedServices } from '../src/admin/seed-data';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const service of seedServices) {
    const expectedContent = service.expectedContent ?? null;
    await prisma.monitoredService.upsert({
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
  console.log(`Seed complete: ${seedServices.length} services upserted.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

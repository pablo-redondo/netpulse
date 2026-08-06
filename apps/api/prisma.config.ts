import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // process.env, no el helper env(): ese valida y revienta en cuanto se
    // carga el config, incluso para "prisma generate", que no toca la base
    // de datos y no debería necesitar la variable en absoluto. Los comandos
    // que sí conectan (migrate, db seed) fallan igualmente si falta, pero
    // con su propio error al intentar conectar, no al cargar el config.
    url: process.env.DATABASE_URL,
  },
});

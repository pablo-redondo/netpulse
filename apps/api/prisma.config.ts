import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Este config lo lee SOLO el CLI de Prisma (migrate, generate, db seed);
    // la aplicación en marcha abre su propia conexión en PrismaService. Esa
    // separación es la que nos deja mandar cada uno por donde le conviene.
    //
    // DIRECT_URL primero: contra Neon, las migraciones tienen que ir por la
    // cadena SIN pooler. El pooler (pgBouncer en modo transacción) devuelve
    // la conexión al pool al terminar cada transacción, y una migración
    // necesita estado de sesión —locks de aviso, DDL transaccional—, así que
    // por ahí falla. La app, en cambio, sí usa la cadena con pooler.
    //
    // Si DIRECT_URL no está definida se cae a DATABASE_URL, que es lo normal
    // en local: un Postgres de desarrollo no tiene pooler delante.
    //
    // process.env, no el helper env(): ese valida y revienta en cuanto se
    // carga el config, incluso para "prisma generate", que no toca la base
    // de datos y no debería necesitar la variable en absoluto. Los comandos
    // que sí conectan (migrate, db seed) fallan igualmente si falta, pero
    // con su propio error al intentar conectar, no al cargar el config.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});

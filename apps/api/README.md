# @netpulse/api

Backend de NetPulse (NestJS + Prisma + PostgreSQL). Ver
[`DESIGN.md`](../../DESIGN.md) en la raíz del monorepo para el diseño
completo del proyecto.

## Desarrollo local

```bash
docker compose up -d          # Postgres local
cp .env.example .env
pnpm --filter @netpulse/api prisma:migrate
pnpm --filter @netpulse/api prisma:seed
pnpm --filter @netpulse/api start:dev
```

# NetPulse

Dashboard de monitorización de red/infraestructura. Proyecto pensado para
demostrar conocimientos de redes (ASIR) y de desarrollo web moderno (DAW):
comprobaciones periódicas de servicios públicos reales (HTTP, DNS, TCP),
histórico de uptime/latencia y una vista de topología ilustrativa de
segmentación de red.

Diseño completo del proyecto: [`DESIGN.md`](./DESIGN.md).

## Stack

- **Backend**: NestJS + Prisma + PostgreSQL (`apps/api`)
- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS (`apps/web`)
- **Tipos compartidos**: `packages/shared-types`
- **Monorepo**: pnpm workspaces

> Proyecto en desarrollo activo. Este README se ampliará a medida que avance
> la implementación.

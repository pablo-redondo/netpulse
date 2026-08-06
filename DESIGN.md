# NetPulse — Documento de diseño

> Dashboard de monitorización de red/infraestructura. Proyecto pensado para
> demostrar conocimientos de redes (ASIR) y de desarrollo web moderno (DAW).
> Este documento se propone para aprobación antes de generar ningún archivo
> de código.

## 1. Nombre del proyecto

| Opción | Razón |
|---|---|
| **NetPulse** | Coincide con el nombre del repo (`netpulse`). Transmite "latido" = monitorización continua. Corto, fácil de pronunciar en una entrevista. |
| **Uptime Grid** | Enfatiza la cuadrícula de servicios + % de disponibilidad, núcleo visual del dashboard. |
| **Watchtower Net** | Más evocador ("torre de vigilancia"), pero puede confundirse con la herramienta real `containrrr/watchtower` (Docker). |

**Recomendación: NetPulse** — ya coincide con el repo existente y evita colisión de nombres con herramientas reales conocidas.

## 2. Qué se monitoriza

Selección deliberada de 10 servicios públicos, cubriendo los 3 tipos de check:

| Servicio | Tipo de check | Detalle |
|---|---|---|
| github.com | HTTP | GET a `/`, código 200, latencia |
| google.com | HTTP | GET a `/`, código 200/301, latencia |
| cloudflare.com | HTTP | GET a `/`, código 200, latencia |
| api.github.com | HTTP | GET a `/` (JSON), valida `Content-Type` |
| 1.1.1.1 (Cloudflare DNS) | DNS | Resuelve `github.com` contra este resolver, mide tiempo |
| 8.8.8.8 (Google DNS) | DNS | Resuelve `google.com` contra este resolver, mide tiempo |
| 9.9.9.9 (Quad9 DNS) | DNS | Resuelve `cloudflare.com`, mide tiempo (resolver enfocado en seguridad, aporta variedad) |
| github.com:443 | TCP | Conexión TCP pura al puerto 443 (sin handshake HTTP), mide tiempo de conexión |
| 1.1.1.1:53 | TCP | Conexión TCP al puerto 53 de un resolver DNS público (DNS también corre sobre TCP, no solo UDP) |
| smtp.gmail.com:587 | TCP | Conexión TCP a un puerto SMTP conocido — variedad de protocolos más allá de web/DNS |

Esto da 4 HTTP, 3 DNS, 3 TCP — variedad real, no relleno.

Los checks HTTP envían un header `User-Agent` identificable (ej.
`NetPulse-Monitor/1.0 (portfolio project)`) en cada petición, para que
cualquier operador de los servicios monitorizados pueda identificar el
origen del tráfico si revisa sus logs.

### Por qué no ICMP/ping real

Node.js no tiene acceso a raw sockets sin capacidades elevadas (`CAP_NET_RAW`
en Linux, o ejecutar como root/Administrator). Librerías como `ping` o
`net-ping` en realidad invocan el binario `ping` del sistema operativo vía
`child_process`, lo cual:

- No funciona igual en todos los entornos de despliegue (PaaS serverless
  como Render suelen no tener el binario, o lo bloquean por seguridad).
- Introduce una dependencia frágil del SO en vez de una comprobación de red
  hecha en la capa de aplicación.

En su lugar, el check TCP a un puerto conocido (ej. 443/53) cumple el mismo
propósito educativo — demuestra alcanzabilidad y mide latencia de conexión —
usando sockets normales de Node (`net.Socket`), que sí son first-class y
funcionan igual en cualquier PaaS. Esta decisión se documentará explícitamente
en el README ("Por qué no hay ping ICMP") para que quede claro que es una
limitación técnica real y no un atajo.

## 3. Arquitectura backend (NestJS)

```
src/
├── checks/                  # Lógica de cada tipo de comprobación
│   ├── checks.module.ts
│   ├── checks.service.ts    # orquesta: recibe un "monitored service" y devuelve un resultado
│   ├── strategies/
│   │   ├── http-check.strategy.ts
│   │   ├── dns-check.strategy.ts
│   │   └── tcp-check.strategy.ts
│   └── checks.interface.ts  # contrato común CheckStrategy.run(target): CheckResult
├── schedule/                 # Disparo periódico
│   ├── schedule.module.ts
│   └── schedule.service.ts  # usa @nestjs/schedule (@Cron / SchedulerRegistry)
├── services/                 # Lectura de "servicios monitorizados"
│   ├── services.module.ts
│   ├── services.controller.ts
│   └── services.service.ts
├── history/                   # Consultas de histórico/uptime
│   ├── history.module.ts
│   ├── history.controller.ts
│   └── history.service.ts   # cálculo de uptime %, series agregadas para gráficas
└── prisma/
    └── prisma.service.ts
```

**Patrón strategy** para los checks: cada tipo (`http`, `dns`, `tcp`)
implementa la misma interfaz `CheckStrategy`, y `ChecksService` elige la
estrategia según el campo `type` del servicio. Añadir un cuarto tipo de check
en el futuro no toca el scheduler ni el resto del sistema.

**Scheduler**: `@nestjs/schedule` (envuelve `node-cron` con integración DI de
Nest, más idiomático que usar `node-cron` a pelo). Un único `@Cron` (intervalo
configurable por env var `CHECK_INTERVAL_MS`, por defecto `300000` = 5
minutos) que:

1. Lee todos los servicios activos (`ServicesService.findAllActive()`).
2. Lanza los checks en paralelo (`Promise.allSettled`, para que un timeout en
   uno no tumbe a los demás).
3. Persiste cada resultado vía `HistoryService.record()`.

No se usa un cron distinto por servicio — con `Promise.allSettled` sobre una
lista es suficiente a esta escala y evita registrar/desregistrar cron jobs
dinámicamente cuando se añaden/borran servicios desde la UI.

Se eligen 5 minutos como intervalo por defecto (en vez de 60s) para ser un
vecino de red respetuoso con los servicios públicos monitorizados — evita
generar tráfico HTTP/DNS/TCP innecesario contra terceros que no han dado
permiso explícito para un scrapeo agresivo.

**Persistencia**: cada resultado se escribe directamente en Postgres vía
Prisma inmediatamente después de ejecutarse el check (sin cola intermedia —
no hace falta a este volumen).

**Alta de servicios**: no hay endpoints públicos de escritura en
`ServicesModule`. Los 10 servicios monitorizados se siembran una única vez
mediante `prisma/seed.ts` tras el primer despliegue (ver punto 5 del seed).
El controller de `services` expone únicamente lecturas (`GET /services`,
`GET /services/:id`); no hay `POST`/`PATCH`/`DELETE`. Esto simplifica el
alcance (sin autenticación/autorización que proteger) y es coherente con que
la lista de servicios monitorizados es curada y fija, no gestionada por
usuarios finales.

## 4. Esquema de datos (Prisma)

```prisma
enum CheckType {
  HTTP
  DNS
  TCP
}

model MonitoredService {
  id          String   @id @default(cuid())
  name        String   @unique // permite upsert idempotente desde prisma/seed.ts
  type        CheckType
  target      String   // URL para HTTP, hostname para DNS, "host:port" para TCP
  vlanGroup   String?  // agrupación ilustrativa para la vista de topología (ver punto 5)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  results     CheckResult[]
  hourlyStats HourlyStat[]

  @@index([isActive])
}

model CheckResult {
  id           String    @id @default(cuid())
  serviceId    String
  service      MonitoredService @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  timestamp    DateTime  @default(now())
  success      Boolean
  latencyMs    Int?
  statusCode   Int?      // solo relevante para HTTP
  errorMessage String?

  @@index([serviceId, timestamp(sort: Desc)])
}

// Agregado pre-calculado para que las gráficas de histórico y el % de uptime
// no tengan que escanear CheckResult completa en cada petición.
model HourlyStat {
  id            String   @id @default(cuid())
  serviceId     String
  service       MonitoredService @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  hourBucket    DateTime          // truncado a la hora
  totalChecks   Int
  successChecks Int
  latencyChecks Int      @default(0) // denominador de avgLatencyMs
  avgLatencyMs  Float?

  @@unique([serviceId, hourBucket])
  @@index([serviceId, hourBucket(sort: Desc)])
}
```

**Por qué el agregado `HourlyStat`**: calcular uptime % o pintar una gráfica
de "latencia últimos 30 días" sobre `CheckResult` en crudo (con check cada
5 min → ~8.600 filas/servicio/mes) obliga a escanear/agrupar en cada request.
Frente a eso, el agregado deja la misma consulta en ~720 filas.

La media de latencia se pondera contra `latencyChecks`, no contra
`totalChecks`: una comprobación que falla sin llegar a medir nada (un timeout)
suma al total pero no tiene latencia que promediar, y meterla en el divisor
hundiría la media de las que sí midieron. Un
job (dentro del mismo `@Cron` de scheduling, o uno aparte cada hora) va
escribiendo/actualizando `HourlyStat` mediante upsert. Las consultas de
dashboard leen `HourlyStat` (pocas filas, indexado por
`serviceId + hourBucket`); `CheckResult` se sigue guardando para detalle
reciente (ej. "últimos 20 checks") y se puede purgar/particionar más adelante
sin afectar al histórico agregado.

`onDelete: Cascade` en ambas relaciones — al borrar un servicio no deben
quedar resultados huérfanos.

## 5. Vista de topología (ilustrativa)

Objetivo: comunicar que entiendes segmentación de red (VLANs/subredes), **no**
hacer descubrimiento real de topología (eso requeriría acceso a la
infraestructura del usuario, fuera de alcance de un proyecto sobre servicios
públicos).

**Diseño**: vista tipo "diagrama de red" con nodos agrupados visualmente por
`vlanGroup` (campo del esquema, ej. `"VLAN 10 - Web"`, `"VLAN 20 - DNS"`,
`"VLAN 30 - Infra"`), cada grupo dentro de un rectángulo/subred ilustrado con
su rango CIDR simulado (ej. `10.0.10.0/24`) puramente decorativo/asignado a
mano al crear el servicio. Un nodo central "Gateway/Router" (SVG) conecta los
grupos, con líneas cuyo color refleja el estado agregado del grupo (verde =
todo OK, ámbar = degradado, rojo = caído).

**Implementación**: SVG estático generado en el frontend (React) a partir de
los datos de `services` + su último `CheckResult`, sin librería de grafos
pesada (no hace falta layout dinámico, la posición de VLANs es fija/manual).

**Aviso explícito en el README** (sección dedicada, no solo una nota al pie):

> Esta vista de topología es una representación conceptual e ilustrativa de
> segmentación de red (VLANs/subredes), asignada manualmente a cada servicio
> monitorizado. No se trata de una topología descubierta automáticamente por
> la red — NetPulse no tiene acceso a routers, switches ni a la
> infraestructura real de los servicios monitorizados. Su propósito es
> demostrar comprensión del concepto de segmentación, no realizar network
> discovery.

## 6. Plan de despliegue

- **Backend (NestJS + Postgres)** → Render, como proceso persistente (Web
  Service, no serverless), porque `@nestjs/schedule` necesita un proceso
  vivo continuamente para que el cron dispare — mismo patrón que
  `restaurant-api`. Se decidió Render sobre Railway por tener soporte de
  Blueprint-as-code (`render.yaml`) que deja el backend y la base de datos
  reproducibles desde el propio repo, sin configuración manual en el
  dashboard.
- **Frontend (Next.js/React)** → Vercel.
- **Comunicación**: el frontend llama al backend vía HTTPS (REST) desde
  server components, nunca desde el navegador — así no hace falta CORS
  aunque frontend y backend vivan en dominios distintos. Igual que en
  `restaurant-web/api`, si el plan de Render es free tier con cold-start, el
  frontend maneja el spin-up inicial con un reintento y un timeout más largo
  en la primera petición (ver `apps/web/lib/api.ts`). A diferencia de
  restaurant-api, aquí el backend **no puede dormir del todo** entre
  requests porque el scheduler debe seguir corriendo — esto en la práctica
  empuja a un plan de pago o a un servicio always-on de Render,
  decisión/trade-off documentada también en el README (free tier = gaps en
  el histórico durante el sueño; plan pago = monitorización continua real).

## 7. Estructura de repos

**Recomendación: monorepo con pnpm workspaces**, a diferencia del patrón de
dos repos de restaurant-api/restaurant-web.

Por qué aquí sí y allá no:

- Backend y frontend comparten tipos (ej. `CheckType`, forma de
  `MonitoredService`/`CheckResult`) que interesa mantener sincronizados sin
  duplicar — un paquete `packages/shared-types` en el workspace resuelve
  esto limpiamente.
- Es un proyecto más pequeño y de una sola persona; el overhead de coordinar
  dos repos (versionado, PRs cruzados) no aporta valor aquí.
- Ya se usa pnpm — es una oportunidad natural de probar workspaces en un
  proyecto real, cosa que además suma como demostración de herramientas
  modernas (DAW).

```
netpulse/
├── pnpm-workspace.yaml
├── package.json
├── apps/
│   ├── api/          # NestJS
│   └── web/          # Next.js
├── packages/
│   └── shared-types/ # CheckType, DTOs compartidos
└── README.md
```

Despliegue: en Render el `render.yaml` de la raíz define build/start con
`pnpm --filter @netpulse/api ...` en vez de fijar un "root directory", porque
`pnpm --filter` ya detecta el workspace subiendo directorios y así el build
puede compilar primero `shared-types`. Vercel sí usa el "root directory"
(`apps/web`) porque ahí el framework se detecta automáticamente; el mismo
problema de orden se resuelve con un hook `prebuild` en `apps/web/package.json`
que compila `shared-types` antes de `next build`.

---

**Estado: aprobado** (con dos ajustes incorporados sobre la propuesta
inicial: `ServicesModule` de solo lectura con siembra vía `prisma/seed.ts`,
y checks HTTP con `User-Agent` identificable + intervalo del scheduler a
5 minutos por defecto vía `CHECK_INTERVAL_MS`).

Paso 1 (scaffolding inicial, sin lógica de checks/scheduler todavía):
monorepo pnpm workspaces, NestJS + Prisma en `apps/api`, Next.js en
`apps/web`, `packages/shared-types`, seed con los 10 servicios, lint/format,
README mínimo.

# NetPulse

NetPulse comprueba cada pocos minutos si un puñado de servicios públicos de
internet siguen en pie, guarda cuánto tardan en responder y lo pinta en un
panel: disponibilidad, latencia histórica y una vista de segmentación de red.

Lo monté para juntar en un proyecto las dos mitades de lo que estudio: la parte
de redes (ASIR) y la de desarrollo web (DAW). De ahí que no se limite a hacer
peticiones HTTP y ya está, sino que baje también a resolución DNS y a conexión
TCP a pelo.

El diseño completo, con las decisiones y por qué se tomaron, está en
[`DESIGN.md`](./DESIGN.md).

## Qué monitoriza

Son diez servicios públicos, elegidos para cubrir los tres tipos de
comprobación. Ninguno es infraestructura mía: son sitios que ya reciben tráfico
de medio mundo.

| Servicio | Check | Qué hace exactamente |
|---|---|---|
| GitHub | HTTP | GET a `https://github.com`, mide el tiempo hasta la respuesta |
| Google | HTTP | GET a `https://google.com` |
| Cloudflare | HTTP | GET a `https://cloudflare.com` |
| GitHub API | HTTP | GET a `https://api.github.com` |
| Cloudflare DNS | DNS | Resuelve `github.com` preguntándole a 1.1.1.1 |
| Google DNS | DNS | Resuelve `google.com` preguntándole a 8.8.8.8 |
| Quad9 DNS | DNS | Resuelve `cloudflare.com` preguntándole a 9.9.9.9 |
| GitHub TCP:443 | TCP | Abre un socket al 443 y lo cierra, sin hablar HTTP |
| Cloudflare DNS TCP:53 | TCP | Socket al puerto 53, que también escucha en TCP y no solo en UDP |
| Gmail SMTP TCP:587 | TCP | Socket al puerto de submission de correo |

Un check HTTP se da por bueno si el código es menor que 400. Los de DNS y TCP
no tienen código de estado: cuentan como correctos si la resolución devuelve al
menos una dirección o si el socket llega a conectar.

Las peticiones HTTP van con un `User-Agent` identificable
(`NetPulse-Monitor/1.0 (portfolio project)`), para que cualquiera que mire sus
logs y se pregunte quién le está dando la lata pueda saber de dónde sale.

El intervalo por defecto es de cinco minutos. Podría ser menos, pero son
servicios de terceros que no me han dado permiso para nada, así que prefiero
pasarme de discreto que de insistente.

## Por qué no hay ping

Lo primero que pide el cuerpo en un proyecto así es un ping de toda la vida. No
lo hay, y no es por pereza.

Un ping ICMP necesita un raw socket, y abrir un raw socket requiere privilegios
elevados: `CAP_NET_RAW` en Linux, o directamente root. Node no da acceso a raw
sockets desde la API estándar. Las librerías de npm que prometen "ping" casi
siempre hacen una de dos cosas: o piden esa capability, o —lo más común—
lanzan el binario `ping` del sistema con `child_process` y parsean su salida.

Esa segunda vía es la que me hizo descartarlo. Significa depender de que exista
un binario concreto, de que su salida tenga el formato que esperas y de que la
plataforma donde despliegues te deje ejecutarlo. En un contenedor de un PaaS
como Render eso no está garantizado ni de lejos, y cuando falla lo hace de una
forma bastante fea: el check no es que dé "caído", es que revienta.

La alternativa que uso es el check TCP. Abrir un socket a un puerto conocido
—el 443 de un servidor web, el 53 de un resolver— responde a la misma pregunta
que quería responder con el ping: ¿llego hasta ahí, y cuánto tardo? La
diferencia es que `net.Socket` es API de primera clase en Node, se comporta
igual en cualquier sitio donde lo despliegues y mide un tiempo que además es
más representativo de lo que sufre un usuario real, porque incluye el
establecimiento de conexión y no solo el ida y vuelta de la capa de red.

Dicho de otro modo: se pierde el ICMP puro, pero se gana algo que funciona
siempre y que mide algo más útil.

## La vista de topología es ilustrativa

Esto conviene dejarlo claro antes de que nadie se lleve una impresión
equivocada al abrir la pestaña de topología.

Las VLAN, las subredes y el router que aparecen en ese diagrama **están
puestos a mano**. Cada servicio lleva un campo `vlanGroup` que le asigno yo en
el seed, con un rango CIDR inventado del estilo `10.0.10.0/24`. NetPulse no
tiene acceso a routers ni a switches, no hace SNMP, no escanea nada y no
descubre absolutamente ninguna topología. No podría: son servicios públicos de
otras empresas, y ponerse a escanear infraestructura ajena no es algo que se
haga.

Lo que sí es real en ese diagrama es el estado de cada nodo, que sale de las
comprobaciones que el scheduler ha hecho de verdad. El color de cada segmento
es el peor estado de los servicios que contiene.

La vista está ahí porque agrupar servicios por segmento y ver de un vistazo qué
parte de la red está tocada es una forma útil de mirar un panel, y porque quería
enseñar que entiendo el concepto. Pero es una ilustración, no un
descubrimiento.

## Cómo está montado

Es un monorepo con pnpm workspaces:

```
apps/api     backend NestJS + Prisma + PostgreSQL
apps/web     frontend Next.js (App Router) + Tailwind
packages/shared-types   tipos que comparten los dos
```

Elegí monorepo en lugar de dos repos separados sobre todo por
`shared-types`. El backend y el frontend se pasan las mismas formas de datos
—`CheckType`, `MonitoredService`, `CheckResult`— y tenerlas en un paquete del
workspace evita el clásico baile de duplicar interfaces y que se desincronicen
sin que te enteres hasta que algo peta en producción.

En el backend, cada tipo de comprobación es una estrategia con la misma
interfaz (`CheckStrategy`), y `ChecksService` elige cuál usar según el campo
`type` del servicio. Añadir un cuarto tipo de check no toca el scheduler ni
nada más. El scheduler en sí es un único intervalo de `@nestjs/schedule` que
lee los servicios activos, lanza todos los checks en paralelo con
`Promise.allSettled` —para que un timeout no se lleve por delante a los demás—
y guarda cada resultado.

El frontend son server components que consumen la API directamente. No hay
llamadas desde el navegador, así que tampoco hay CORS que configurar.

## El modelo de datos

Hay tres tablas y la tercera es la interesante:

`MonitoredService` es cada cosa que se vigila. `CheckResult` es cada
comprobación individual, con su timestamp, su latencia, si fue bien y el
mensaje de error si fue mal.

`HourlyStat` es un agregado por servicio y hora: cuántos checks hubo, cuántos
salieron bien y la latencia media. Existe porque calcular un uptime del último
mes contando filas de `CheckResult` significa recorrer unas 8.600 filas por
servicio, y eso en cada carga del panel. Con el agregado, la misma consulta
toca unas 720 filas y va sobre un índice de `(serviceId, hourBucket)`.

La media de latencia se actualiza de forma incremental cada vez que entra un
check, en la misma transacción que inserta el `CheckResult`. Tiene un detalle
que me costó ver: el divisor no puede ser el número total de comprobaciones,
sino solo las que llegaron a medir algo. Un timeout entra en `totalChecks`
pero no tiene latencia, y si lo dejas en el denominador va tirando la media
hacia abajo aunque ninguna de las respuestas reales haya ido más lenta. Por eso
hay una columna aparte, `latencyChecks`, que es la que se usa para promediar.

`CheckResult` no se tira: es la única vista donde se ve el mensaje de error
concreto de cada fallo, y la pantalla de detalle la usa para listar las últimas
comprobaciones. Simplemente no se consulta para nada que tenga que agregar
mucho histórico.

## Ponerlo en marcha en local

Hace falta Node 20 o superior, pnpm 10 y Docker para levantar el Postgres.

```bash
pnpm install
```

El backend necesita una base de datos antes de arrancar:

```bash
cd apps/api
docker compose up -d          # Postgres en el 5432
cp .env.example .env
pnpm prisma:migrate           # aplica las migraciones
pnpm prisma:seed              # mete los 10 servicios
```

El seed usa upsert por nombre, así que se puede volver a ejecutar sin
duplicar nada.

Ya desde la raíz del repo, en dos terminales:

```bash
pnpm dev:api    # http://localhost:3001
pnpm dev:web    # http://localhost:3000
```

El primer ciclo de comprobaciones se lanza nada más arrancar la API, sin
esperar al intervalo, para no quedarte mirando un panel vacío cinco minutos.
Aun así, la gráfica de latencia necesita al menos dos horas distintas de
histórico para dibujar una curva; hasta entonces enseña la lectura que tenga y
lo dice.

Para desarrollar sin esperas, `CHECK_INTERVAL_MS=15000` en el `.env` va bien.

## Variables de entorno

En `apps/api`:

| Variable | Por defecto | Para qué |
|---|---|---|
| `DATABASE_URL` | — | Cadena de conexión a PostgreSQL. Obligatoria |
| `PORT` | `3000` | Puerto del backend. El `.env.example` lo pone en `3001` para no chocar con Next |
| `CHECK_INTERVAL_MS` | `300000` | Cada cuánto se lanza la ronda de comprobaciones |

En `apps/web`:

| Variable | Por defecto | Para qué |
|---|---|---|
| `NETPULSE_API_URL` | `http://localhost:3001` | Dónde vive la API. Se lee en servidor, no se expone al navegador |

## La API

Todo es de solo lectura. No hay endpoints de escritura a propósito: la lista de
servicios es fija y se siembra con el seed, así que no hay nada que crear desde
fuera y tampoco autenticación que proteger.

| Endpoint | Qué devuelve |
|---|---|
| `GET /services` | Los servicios monitorizados |
| `GET /services/:id` | Uno concreto |
| `GET /services/:id/status` | La última comprobación |
| `GET /services/:id/uptime?hours=24` | Disponibilidad agregada de la ventana |
| `GET /services/:id/history?hours=24` | Serie horaria para la gráfica |
| `GET /services/:id/checks?limit=20` | Últimas comprobaciones en crudo, con errores |

`hours` admite hasta 720 (30 días) y `limit` hasta 100; por encima de eso se
recorta. Si el id no existe, 404.

## Sobre el panel

El panel tiene tres pantallas: el listado de servicios agrupados por segmento,
el detalle de un servicio con su gráfica de latencia, y la topología.

Un par de decisiones que quizá no se ven a simple vista. El estado nunca se
comunica solo con color: cada uno lleva su icono y su etiqueta de texto, y en
el SVG de la topología los glifos tienen formas distintas además de colores
distintos. Y la gráfica de latencia tiene debajo un desplegable con los mismos
datos en tabla, porque un valor que solo puedes leer pasando el ratón por
encima es un valor que hay gente que no va a poder leer.

Hay modo claro y oscuro. El oscuro no es una inversión automática del claro:
son colores elegidos para fondo oscuro.

## Estado del proyecto

Funciona de punta a punta en local: las comprobaciones se ejecutan, se guardan,
se agregan y se pintan.

Lo que falta:

- Desplegarlo. El backend necesita un proceso que no se duerma, porque si el
  scheduler se para deja huecos en el histórico. Eso apunta a un servicio
  always-on en Render o Railway. El frontend va a Vercel.
- Tests. Ahora mismo solo está el spec que viene con el scaffold de Nest. Los
  sitios que más lo piden son las estrategias de check (el parseo de
  `host:puerto` y `dominio@resolver`, y el manejo de timeouts) y la media
  ponderada incremental de `HourlyStat`, que es donde hay más aritmética que
  se puede torcer.
- Capturas de pantalla aquí, en cuanto esté desplegado y haya datos reales de
  varios días.

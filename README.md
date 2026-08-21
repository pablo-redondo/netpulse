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

Son veintiún servicios públicos, elegidos para cubrir los cinco tipos de
comprobación. Ninguno es infraestructura mía: son sitios que ya reciben tráfico
de medio mundo. El catálogo completo vive en un único sitio,
[`apps/api/src/admin/seed-data.ts`](./apps/api/src/admin/seed-data.ts), del
que tiran tanto el seed de desarrollo como el de producción.

| Servicio (ejemplos) | Check | Qué hace exactamente |
|---|---|---|
| GitHub, Google, Cloudflare, GitHub API | HTTP | GET a la URL, mide el tiempo hasta la respuesta |
| Wikipedia, DuckDuckGo | HTTP + contenido | Además del código, comprueba que el body contiene un texto concreto |
| Cloudflare / Google / GitHub DNS | DNS | Resuelve un hostname preguntándole a un resolver público distinto |
| GitHub TCP:443, Gmail SMTP TCP:587... | TCP | Abre un socket al puerto y lo cierra, sin hablar el protocolo de aplicación |
| Cloudflare / GitHub / Google / Docker Hub TLS | TLS | Abre un handshake TLS y mira cuántos días le quedan al certificado |
| Cloudflare NTP, Google NTP | NTP | Cliente NTP propio por UDP: calcula el desfase entre el reloj local y el del servidor |

Un check HTTP se da por bueno si el código es menor que 400 y, si el servicio
tiene `expectedContent` configurado, si además el body contiene ese texto —útil
para detectar una web que responde 200 pero sirve una página de error o un
placeholder. Los de DNS y TCP no tienen código de estado: cuentan como
correctos si la resolución devuelve al menos una dirección o si el socket
llega a conectar. El de TLS falla si el certificado ya caducó o si le quedan
menos de 14 días, para poder avisar antes de que caduque de verdad. El de NTP
falla si la respuesta viene con stratum inválido (0 o ≥16, que en el protocolo
significa "no confíes en esta hora").

Cada comprobación, además de si fue bien o mal, guarda un detalle técnico
propio del protocolo —el header `Server` en HTTP, las IPs resueltas en DNS, la
IP remota en TCP, la versión TLS y el emisor del certificado, el desfase de
reloj en milisegundos en NTP—, visible en la tabla de últimas comprobaciones
de cada servicio.

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

El check TLS nació de la misma lógica: es otra comprobación "de red" que no
necesita privilegios especiales —`tls.connect` es API estándar de Node— y que
además resuelve un problema real y muy típico en ASIR, el del certificado que
caduca un fin de semana y nadie se entera hasta que un usuario se lo encuentra.

El check NTP va un paso más allá: en vez de envolver una librería, implementa
el protocolo a mano sobre `node:dgram` —un socket UDP normal, sin privilegios—
construyendo el paquete de 48 bytes de NTPv3 y aplicando la fórmula clásica de
sincronización con las cuatro marcas de tiempo (T1–T4) para calcular el
desfase de reloj. Es el hueco que dejó el ping: un protocolo de verdad, a
bajo nivel, que no depende de ningún binario del sistema.

## Incidentes y alertas

Cada comprobación fallida no genera ruido por sí sola: lo que importa es el
tramo continuo de caída, no cada intento individual. `IncidentsService` abre
un incidente en el primer fallo tras un tramo sano y lo cierra en el primer
éxito tras uno caído; los fallos repetidos mientras el incidente sigue abierto
no crean nada nuevo. Cada servicio tiene su propio histórico de incidentes
(`GET /services/:id/incidents`), y hay un feed global con los más recientes de
todos (`GET /incidents/recent`), que es lo que alimenta la página de estado
pública.

Si se configura `ALERT_WEBHOOK_URL` (un webhook entrante de Discord o Slack),
`NotificationsService` manda un aviso al abrir y al resolver cada incidente.
Sin esa variable, no pasa nada: es una función opcional, pensada para no ser
un requisito para que el resto de NetPulse funcione.

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

Hay cuatro tablas, y las dos últimas son las interesantes:

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

`Incident` es la cuarta tabla, y no la escribe nadie a mano: la mantiene
`IncidentsService` a partir de las transiciones de estado de cada servicio
(ver "Incidentes y alertas" más arriba). Un incidente sin `resolvedAt` es uno
que sigue abierto ahora mismo.

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
| `ALERT_WEBHOOK_URL` | — | Opcional. Webhook de Discord/Slack para avisos de caída/recuperación |
| `SEED_SECRET` | — | Opcional en local. Protege `GET /admin/seed`; en Render lo genera el blueprint |

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
| `GET /services/:id/history.csv?hours=24` | El histórico horario, como CSV descargable |
| `GET /services/:id/incidents?limit=20` | Incidentes (caídas) de ese servicio |
| `GET /incidents/recent?limit=20` | Los incidentes más recientes de todos los servicios |

`hours` admite hasta 720 (30 días) y `limit` hasta 100; por encima de eso se
recorta. Si el id no existe, 404.

Hay una excepción a "todo es de solo lectura": `GET /admin/seed?secret=...`,
protegido por `SEED_SECRET`, que vuelve a sembrar el catálogo de servicios.
Existe porque el plan free de Render no da acceso a Shell ni a Jobs, así que
es la única forma de sembrar la base de datos de producción sin salir de la
red interna de Render (ver "Despliegue" más abajo).

## Sobre el panel

El panel tiene cuatro pantallas: el listado de servicios agrupados por
segmento, el detalle de un servicio con su gráfica de latencia y sus
incidentes, la topología, y una página de estado pública (`/status`) pensada
para compartir sin dar acceso al resto del panel —solo el estado agregado, el
listado de servicios y el feed de incidentes recientes.

La pantalla de detalle tiene un botón "Exportar CSV" que descarga el
histórico horario del rango seleccionado. Como la API no es pública (la URL
del backend no se expone al navegador), lo sirve un route handler de Next.js
que hace de proxy server-side.

Un par de decisiones que quizá no se ven a simple vista. El estado nunca se
comunica solo con color: cada uno lleva su icono y su etiqueta de texto, y en
el SVG de la topología los glifos tienen formas distintas además de colores
distintos. Y la gráfica de latencia tiene debajo un desplegable con los mismos
datos en tabla, porque un valor que solo puedes leer pasando el ratón por
encima es un valor que hay gente que no va a poder leer.

### El tema, y por qué los colores no están elegidos a ojo

El panel va en negro con verde de fósforo, como una terminal antigua. No hay
modo claro: la pantalla negra *es* la identidad del proyecto, y una variante
clara sería otra cosa distinta con el mismo nombre. Lo que sí se puede apagar,
desde la cabecera, son los efectos de CRT —las scanlines y el brillo—, por si
resultan ruidosos o incómodos de leer. Toda la interfaz va en JetBrains Mono,
que además trae cifras tabulares de serie, que es justo lo que quieren las
tablas y los ejes.

El problema interesante del tema es que el verde de fósforo quiere ser dos
cosas a la vez: la identidad de la marca y el color de "esto va bien". Si todo
es verde neón, "operativo" deja de significar nada. Se resuelve en tres capas:

- El **verde saturado** queda reservado para el estado OK y unos pocos acentos
  de identidad. El resto del chrome —bordes, rejilla, texto secundario— usa
  verdes desaturados que no compiten.
- La **serie de datos** (la latencia) va en cian, no en verde: así la gráfica
  nunca se confunde con el semáforo de estado.
- En las superficies donde lo sano se repite mucho —las barras de
  disponibilidad por hora, la tira de sondas— el verde va **atenuado**. Lo
  sano es el fondo; lo que falla es lo que tiene que saltar a la vista.

Los valores concretos no están elegidos a ojo: salen de una búsqueda sobre el
espacio OKLCH validada con un script contra la superficie real del panel,
exigiendo que cualquier par de colores se distinga tanto en visión normal como
simulando protanopia y deuteranopia. El primer intento —verde `#00ff41` con un
ámbar clásico— fallaba precisamente ahí: con deuteranopia los dos colores se
juntaban (ΔE 5.2, por debajo del suelo de 6), y "operativo" e "inestable" son
justo los dos estados que no se pueden confundir en un monitor. La paleta final
mide ΔE 10.1 en el peor par bajo daltonismo y 26.7 en visión normal, y todos
los colores pasan de 3:1 de contraste contra el fondo.

## Tests

```bash
pnpm test          # desde la raíz, o
cd apps/api && pnpm test
```

Están centrados en las dos zonas donde un fallo pasaría desapercibido a
simple vista: las tres estrategias de check y el agregado de `HourlyStat`.

Las estrategias van con `fetch`, `dns.Resolver` y `net.Socket` mockeados
—no salen a internet de verdad al testear—, y cubren tanto el parseo del
target (`host:puerto`, `hostname@resolverIP`, incluida una IP como host) como
los casos de fallo: timeout, conexión rechazada, DNS que no resuelve, un 500
que sí llegó a responder frente a un error de red que no llegó a nada.

El agregado de `HourlyStat` tiene su aritmética sacada a una función pura,
`accumulateHourlyStat`, justo para poder testearla sin levantar una base de
datos. Uno de esos tests reproduce literalmente el bug que se coló la primera
vez: una secuencia `100, 200, timeout, 300` tiene que dar de media 200, no
187.5.

## Despliegue

El backend va a Render y el frontend a Vercel, cada uno por su lado. La razón
de que sean dos sitios distintos y no todo junto es que el backend necesita
seguir vivo entre peticiones —tiene un scheduler corriendo dentro— y eso pide
un proceso persistente, mientras que el frontend es un montón de páginas que
se sirven bajo demanda y encajan mejor en algo como Vercel.

### Backend (Render)

Hay un `render.yaml` en la raíz que describe el servicio y la base de datos,
así que no hace falta rellenar formularios a mano:

1. En Render, "New +" → "Blueprint", y apuntar al repo en la rama `main`.
   Render lee `render.yaml` y propone crear `netpulse-db` (Postgres) y
   `netpulse-api` (el backend). Se aceptan los dos.
2. El build ya se encarga de instalar, compilar `shared-types`, aplicar las
   migraciones de Prisma y compilar el backend, en ese orden. No hay que
   tocar nada más para que arranque.
3. Sembrar el catálogo es cosa de una vez: visitar
   `https://<tu-servicio>.onrender.com/admin/seed?secret=<SEED_SECRET>` en el
   navegador. `SEED_SECRET` lo genera el propio blueprint —está en la pestaña
   Environment del servicio en Render— y el endpoint hace upsert por nombre,
   así que volver a llamarlo tras añadir servicios nuevos al catálogo es
   seguro. No hace falta Shell ni Jobs, que en el plan free de Render son de
   pago: por eso el sembrado va por un endpoint HTTP y no por un comando
   suelto.

4. Opcional: para recibir alertas de caídas y recuperaciones en Discord o
   Slack, añadir `ALERT_WEBHOOK_URL` a mano en Environment con la URL del
   webhook entrante. Sin esto, NetPulse funciona igual; simplemente no avisa.

El plan `free` de Render dura lo justo para comprobar que todo esto funciona:
el servicio se duerme a los 15 minutos sin tráfico HTTP —y con él, el
scheduler, así que el histórico se queda con huecos mientras tanto— y la base
de datos gratis expira a los 30 días. Para que esto sea un monitor de verdad y
no un experimento de fin de semana, el paso siguiente es subir `netpulse-api`
a un plan de pago tipo Starter, que no se duerme.

### Frontend (Vercel)

1. Importar el repo en Vercel. El framework se detecta solo; lo único que
   hay que fijar a mano es el **Root Directory**: `apps/web`.
2. Una variable de entorno: `NETPULSE_API_URL`, con la URL pública que dio
   Render (algo como `https://netpulse-api.onrender.com`).

No hace falta tocar CORS en ningún sitio. El frontend llama a la API desde
server components, no desde el navegador, así que esas peticiones nunca
cruzan de dominio desde el punto de vista de un navegador —van de servidor a
servidor.

Lo que sí toca el navegador es el primer visitante después de que Render haya
dormido el backend: esa petición tarda de más mientras la instancia arranca.
`lib/api.ts` ya cuenta con esto —reintenta una vez con un margen bastante
más generoso antes de rendirse— y si aun así no llega a tiempo, el panel
enseña un aviso en vez de un error pelado.

## Estado del proyecto

Desplegado y funcionando: backend en Render, frontend en Vercel, base de
datos sembrada y el scheduler corriendo de verdad contra los servicios
públicos del catálogo.

Lo que falta:

- Las capturas de pantalla de este README, con datos reales acumulados.

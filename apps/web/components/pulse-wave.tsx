/**
 * La traza de electrocardiograma de la cabecera: el motivo central del
 * tema, literal -NetPulse vigila el pulso de una red. El trazado de un
 * "latido" se dibuja dos veces seguidas en el mismo `<path>` (offset por
 * `TILE` px); `.pulse-track` (globals.css) desplaza el SVG con `transform`
 * exactamente un tile por bucle, así que el barrido es perfecto sin JS ni
 * recalcular nada en cada frame. Puramente decorativo: el estado real vive
 * en el badge y el número que acompaña, nunca aquí.
 */
const TILE = 168;
const HEIGHT = 40;
const MID = HEIGHT / 2;

// Un tile: línea plana, un latido (subida-bajada-subida corta), línea plana.
function beat(offset: number): string {
  const p = (x: number) => x + offset;
  return [
    `M${p(0)},${MID}`,
    `L${p(26)},${MID}`,
    `L${p(34)},${MID}`,
    `L${p(40)},${MID - 16}`,
    `L${p(47)},${MID + 16}`,
    `L${p(53)},${MID - 8}`,
    `L${p(58)},${MID}`,
    `L${p(TILE)},${MID}`,
  ].join(' ');
}

const PATH = `${beat(0)} ${beat(TILE)}`;

export function PulseWave({ className }: { className?: string }) {
  return (
    <div className={`pulse-track ${className ?? ''}`} style={{ width: TILE }} aria-hidden>
      <svg width={TILE * 2} height={HEIGHT} viewBox={`0 0 ${TILE * 2} ${HEIGHT}`}>
        <path
          d={PATH}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.85}
        />
      </svg>
    </div>
  );
}

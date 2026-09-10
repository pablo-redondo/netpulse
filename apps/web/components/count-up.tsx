'use client';

import { useEffect, useState } from 'react';

interface CountUpProps {
  /** Valor final, ya en porcentaje. `null` se renderiza como "—". */
  value: number | null;
  durationMs?: number;
  className?: string;
}

// Réplica deliberada de `formatUptime` (lib/format.ts): una función no se
// puede pasar de un Server Component a un Client Component como prop -Next
// la rechaza en runtime y cae a renderizado solo-cliente para todo el
// subárbol-, así que esta regla de formato, mínima, vive aquí también en
// vez de cruzar esa frontera.
function formatPercent(value: number): string {
  if (value === 100 || value === 0) return `${Math.round(value)}%`;
  return `${value.toFixed(2)}%`;
}

/**
 * Cifra que cuenta hacia arriba una sola vez al montar: el momento de
 * entrada orquestado de la portada, no un efecto suelto más. El HTML servido
 * ya lleva el valor final -así que sin JS, o antes de hidratar, la cifra es
 * correcta desde el primer pintado, nunca un alarmante "0%" de partida-, y
 * el conteo se dispara justo después, en cuanto React toma el control.
 */
export function CountUp({ value, durationMs = 1000, className }: CountUpProps) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    // El estado inicial ya es `value` (coincide con el HTML servido), así
    // que "no animar" es simplemente no tocar el estado: no hace falta un
    // setState síncrono en el efecto para el caso reducido.
    if (value === null) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame: number;
    const start = performance.now();

    // El propio primer frame de rAF deja `display` cerca de 0 (eased≈0 con
    // `now`≈`start`), así que no hace falta un setState síncrono en el
    // cuerpo del efecto solo para arrancar la cuenta en cero.
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - (1 - progress) ** 3; // ease-out cúbica
      setDisplay(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se dispara una vez al montar, no en cada cambio de valor
  }, []);

  return <span className={className}>{display === null ? '—' : formatPercent(display)}</span>;
}

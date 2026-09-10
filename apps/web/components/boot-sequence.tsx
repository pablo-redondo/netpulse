'use client';

import { useEffect, useState } from 'react';

const LINES = [
  'netpulse boot — v1.0',
  '> resolviendo colectores de red...          OK',
  '> sincronizando sondas http·dns·tcp·tls·ntp...  OK',
  '> enlazando con el panel...                 OK',
];

const LINE_MS = 260;
const HOLD_MS = 300;
const FADE_MS = 350;
const TOTAL_TYPE_MS = LINES.length * LINE_MS;

/**
 * Momento de entrada orquestado, una sola vez por carga -el layout raíz no
 * se remonta en la navegación por cliente, así que esto no se repite al
 * cambiar de pestaña, solo en una carga real de página. Es puramente
 * decorativo y no bloquea nada: el dashboard real ya está en el HTML
 * servido debajo, esto es una cortina que se descorre encima.
 * Se salta entero con `prefers-reduced-motion`.
 */
export function BootSequence() {
  const [phase, setPhase] = useState<'typing' | 'fading' | 'done'>('typing');

  useEffect(() => {
    // Con movimiento reducido, los tres plazos colapsan a 0: `setPhase` solo
    // se llama dentro de un `setTimeout` (async), nunca síncrono en el
    // cuerpo del efecto, y la cortina desaparece en el primer tick en vez de
    // reproducir la animación de máquina de escribir.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const typeMs = reduced ? 0 : TOTAL_TYPE_MS;
    const holdMs = reduced ? 0 : HOLD_MS;
    const fadeMs = reduced ? 0 : FADE_MS;

    const toFade = setTimeout(() => setPhase('fading'), typeMs + holdMs);
    const toDone = setTimeout(() => setPhase('done'), typeMs + holdMs + fadeMs);
    return () => {
      clearTimeout(toFade);
      clearTimeout(toDone);
    };
  }, []);

  if (phase === 'done') return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] flex items-center justify-center bg-plane px-6 transition-opacity"
      style={{ opacity: phase === 'fading' ? 0 : 1, transitionDuration: `${FADE_MS}ms` }}
    >
      <pre className="text-xs leading-relaxed sm:text-sm">
        {LINES.map((line, index) => (
          <span
            key={line}
            className="block w-max overflow-hidden whitespace-pre text-status-good"
            style={{
              animation: `boot-type ${LINE_MS}ms steps(${line.length}) forwards`,
              animationDelay: `${index * LINE_MS}ms`,
              clipPath: 'inset(0 100% 0 0)',
            }}
          >
            {line}
          </span>
        ))}
      </pre>
    </div>
  );
}

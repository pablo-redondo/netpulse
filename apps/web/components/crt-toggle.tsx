'use client';

import { useSyncExternalStore } from 'react';

type Crt = 'on' | 'off';

const CRT_EVENT = 'netpulse-crt-change';

/**
 * El tema no tiene variante clara: la identidad del panel es la pantalla
 * negra de fosforo. Lo que si es opcional son los efectos de CRT (scanlines
 * y glow), que aqui se pueden apagar — util para quien los encuentre ruidosos
 * o le cueste leer sobre ellos.
 *
 * El estado vive en el DOM (`data-crt`) y en localStorage, no en estado de
 * React: el script inline del layout ya lo aplica antes del primer paint.
 */
function subscribe(onChange: () => void): () => void {
  window.addEventListener(CRT_EVENT, onChange);
  return () => window.removeEventListener(CRT_EVENT, onChange);
}

function getSnapshot(): Crt {
  return document.documentElement.dataset.crt === 'off' ? 'off' : 'on';
}

function getServerSnapshot(): Crt {
  return 'on';
}

export function CrtToggle() {
  const crt = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const enabled = crt === 'on';

  const toggle = () => {
    const next: Crt = enabled ? 'off' : 'on';
    document.documentElement.dataset.crt = next;
    try {
      localStorage.setItem('netpulse-crt', next);
    } catch {
      // Modo privado o storage bloqueado: el ajuste sigue valiendo en esta sesion.
    }
    window.dispatchEvent(new Event(CRT_EVENT));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={enabled}
      className="flex items-center gap-2 rounded border border-hairline px-2.5 py-1.5 text-xs tracking-wide text-text-muted transition-colors hover:border-hairline-strong hover:text-text-secondary"
    >
      <span
        aria-hidden
        className="inline-block h-2 w-2 rounded-full"
        style={{
          background: enabled ? 'var(--accent)' : 'transparent',
          boxShadow: enabled ? '0 0 8px var(--accent)' : 'none',
          border: enabled ? 'none' : '1px solid var(--axis)',
        }}
      />
      CRT {enabled ? 'ON' : 'OFF'}
    </button>
  );
}

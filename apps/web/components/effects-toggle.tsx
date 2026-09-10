'use client';

import { useSyncExternalStore } from 'react';

type Fx = 'on' | 'off';

const FX_EVENT = 'netpulse-fx-change';

/**
 * Interruptor de movimiento: apaga el barrido de radar de fondo, el glow y
 * el resto de animaciones decorativas (no las de estado, como el pulso de
 * un badge caído, que son información). El estado vive en el DOM
 * (`data-fx`) y en localStorage; el script inline del layout ya lo aplica
 * antes del primer paint.
 */
function subscribe(onChange: () => void): () => void {
  window.addEventListener(FX_EVENT, onChange);
  return () => window.removeEventListener(FX_EVENT, onChange);
}

function getSnapshot(): Fx {
  return document.documentElement.dataset.fx === 'off' ? 'off' : 'on';
}

function getServerSnapshot(): Fx {
  return 'on';
}

export function EffectsToggle() {
  const fx = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const enabled = fx === 'on';

  const toggle = () => {
    const next: Fx = enabled ? 'off' : 'on';
    document.documentElement.dataset.fx = next;
    try {
      localStorage.setItem('netpulse-fx', next);
    } catch {
      // Modo privado o storage bloqueado: el ajuste sigue valiendo en esta sesión.
    }
    window.dispatchEvent(new Event(FX_EVENT));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={enabled}
      title="Animaciones de fondo y efectos"
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
      fx {enabled ? 'on' : 'off'}
    </button>
  );
}

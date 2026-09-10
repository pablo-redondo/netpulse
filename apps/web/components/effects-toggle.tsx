'use client';

import { useSyncExternalStore } from 'react';

type Fx = 'on' | 'off';

const FX_EVENT = 'netpulse-fx-change';

/**
 * Interruptor de movimiento: apaga el aurora de fondo animado, el glow y las
 * demás animaciones decorativas (no las de estado, como el pulso de un
 * badge caído, que son información). Pensado para quien las encuentre
 * ruidosas o para pantallas donde el blur/backdrop-filter pesa.
 *
 * El estado vive en el DOM (`data-fx`) y en localStorage, no en estado de
 * React: el script inline del layout ya lo aplica antes del primer paint.
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
      title="Animaciones de fondo y efectos de cristal"
      className="glass lift flex items-center gap-2 rounded-full px-3 py-1.5 text-xs tracking-wide text-text-muted hover:text-text-secondary"
    >
      <span
        aria-hidden
        className="inline-block h-2 w-2 rounded-full transition-all"
        style={{
          background: enabled ? 'var(--accent-2)' : 'transparent',
          boxShadow: enabled ? '0 0 8px var(--accent-2)' : 'none',
          border: enabled ? 'none' : '1px solid var(--axis)',
        }}
      />
      Efectos {enabled ? 'ON' : 'OFF'}
    </button>
  );
}

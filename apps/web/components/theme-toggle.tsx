'use client';

import { useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

const THEME_EVENT = 'netpulse-theme-change';

/**
 * El tema vive en el DOM (`data-theme`) y en localStorage, no en estado de
 * React: el script inline del layout ya lo aplica antes del primer paint.
 * Aqui solo nos suscribimos a esa fuente externa para pintar la etiqueta.
 */
function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', onChange);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    media.removeEventListener('change', onChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
}

function getSnapshot(): Theme {
  const stored = document.documentElement.dataset.theme as Theme | undefined;
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// En servidor no hay preferencia observable; el script inline corrige antes
// de que se vea nada.
function getServerSnapshot(): Theme {
  return 'light';
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('netpulse-theme', next);
    } catch {
      // Modo privado o storage bloqueado: el tema sigue aplicandose en esta sesion.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-md border border-hairline px-2.5 py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
      aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
    >
      {theme === 'dark' ? 'Claro' : 'Oscuro'}
    </button>
  );
}

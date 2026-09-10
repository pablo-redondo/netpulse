import type { ServiceState } from '@/lib/format';

// El color de status nunca carga el significado solo: cada estado va
// siempre acompañado de icono + etiqueta de texto. Las formas de los glifos
// son distintas entre sí (no solo el color), así que el estado se lee igual
// sin distinguir tonos.
const STATE_META: Record<
  ServiceState,
  { label: string; short: string; color: string; icon: 'check' | 'cross' | 'alert' | 'dash' }
> = {
  up: { label: 'Operativo', short: 'UP', color: 'var(--status-good)', icon: 'check' },
  unstable: {
    label: 'Inestable',
    short: 'WARN',
    color: 'var(--status-warning)',
    icon: 'alert',
  },
  down: { label: 'Caído', short: 'DOWN', color: 'var(--status-critical)', icon: 'cross' },
  unknown: { label: 'Sin datos', short: 'N/D', color: 'var(--text-muted)', icon: 'dash' },
};

/** Exportado para superficies densas fuera de este archivo (ej. la tarjeta
 * de cada servicio en el diagrama de topología) que quieren el glifo solo,
 * sin la etiqueta larga de `StatusBadge` ni la píldora de `StatusChip`. */
export function StateIcon({ icon, color }: { icon: string; color: string }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (icon === 'check') {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="6.5" />
        <path d="M5.2 8.2l2 2 3.6-4" />
      </svg>
    );
  }
  if (icon === 'cross') {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="6.5" />
        <path d="M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4" />
      </svg>
    );
  }
  if (icon === 'alert') {
    return (
      <svg {...common}>
        <path d="M8 2.2L14.4 13.4H1.6z" />
        <path d="M8 6.6v3.1M8 11.7v.1" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M5.4 8h5.2" />
    </svg>
  );
}

export function StatusBadge({ state }: { state: ServiceState }) {
  const meta = STATE_META[state];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary">
      <span className="relative flex h-3.5 w-3.5 items-center justify-center">
        {state === 'down' && (
          <span
            aria-hidden
            className="pulse-ring-critical absolute h-3.5 w-3.5 rounded-full"
            style={{ background: meta.color }}
          />
        )}
        <StateIcon icon={meta.icon} color={meta.color} />
      </span>
      {meta.label}
    </span>
  );
}

/** Variante compacta para tablas y listas densas. */
export function StatusChip({ state }: { state: ServiceState }) {
  const meta = STATE_META[state];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[11px] font-medium tracking-wide"
      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
    >
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }}
      />
      {meta.short}
    </span>
  );
}

export function statusColor(state: ServiceState): string {
  return STATE_META[state].color;
}

export function statusIcon(state: ServiceState): 'check' | 'cross' | 'alert' | 'dash' {
  return STATE_META[state].icon;
}

export function statusLabel(state: ServiceState): string {
  return STATE_META[state].label;
}

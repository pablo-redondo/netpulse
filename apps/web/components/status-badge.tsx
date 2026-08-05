import type { ServiceState } from '@/lib/format';

// El color de status nunca carga el significado solo: cada estado va
// siempre acompanado de icono + etiqueta de texto.
const STATE_META: Record<
  ServiceState,
  { label: string; color: string; icon: 'check' | 'cross' | 'alert' | 'dash' }
> = {
  up: { label: 'Operativo', color: 'var(--status-good)', icon: 'check' },
  unstable: { label: 'Inestable', color: 'var(--status-warning)', icon: 'alert' },
  down: { label: 'Caído', color: 'var(--status-critical)', icon: 'cross' },
  unknown: { label: 'Sin datos', color: 'var(--text-muted)', icon: 'dash' },
};

function StateIcon({ icon, color }: { icon: string; color: string }) {
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
      <StateIcon icon={meta.icon} color={meta.color} />
      {meta.label}
    </span>
  );
}

export function statusColor(state: ServiceState): string {
  return STATE_META[state].color;
}

export function statusLabel(state: ServiceState): string {
  return STATE_META[state].label;
}

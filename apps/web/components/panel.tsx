import type { CSSProperties, ReactNode } from 'react';

/**
 * Ventana de terminal: la superficie base de casi todo -una barra de título
 * con "LEDs" cuadrados y una etiqueta, y el cuerpo debajo. Opaca de verdad,
 * con esquinas casi rectas: esto es una consola, no una tarjeta con sombra.
 */
export function Panel({
  title,
  meta,
  children,
  bodyClassName = 'p-4',
  stagger,
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  /** Se pone a '' cuando el hijo trae su propio padding (tablas). */
  bodyClassName?: string;
  /** Índice para escalonar la animación de entrada respecto a hermanos. */
  stagger?: number;
}) {
  const style = stagger !== undefined ? ({ '--stagger': stagger } as CSSProperties) : undefined;
  return (
    <section className="rise-in panel overflow-hidden" style={style}>
      <header className="term-bar">
        <span className="term-dots" aria-hidden>
          <span />
          <span />
          <span />
        </span>
        <h2 className="flex-1 text-sm font-semibold text-text-primary">{title}</h2>
        {meta && <div className="text-xs text-text-muted">{meta}</div>}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

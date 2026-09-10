import type { CSSProperties, ReactNode } from 'react';

/**
 * Contenedor de cristal común a la interfaz: una superficie esmerilada con
 * cabecera, que unifica bordes, título y separadores para que todas las
 * secciones se lean como parte del mismo sistema.
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
    <section
      className="rise-in glass overflow-hidden rounded-2xl"
      style={style}
    >
      <header className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3.5">
        <h2 className="text-xs font-semibold tracking-widest text-text-secondary uppercase">
          {title}
        </h2>
        {meta && <div className="text-xs text-text-muted">{meta}</div>}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

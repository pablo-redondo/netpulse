import type { ReactNode } from 'react';

/**
 * Contenedor comun de la interfaz: una "ventana" con barra de titulo, como un
 * panel de terminal. Unifica bordes, cabecera y separadores para que todas
 * las secciones se lean como partes del mismo sistema.
 */
export function Panel({
  title,
  meta,
  children,
  bodyClassName = 'p-4',
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  /** Se pone a '' cuando el hijo trae su propio padding (tablas). */
  bodyClassName?: string;
}) {
  return (
    <section className="overflow-hidden rounded border border-hairline bg-surface-1">
      <header className="flex items-center justify-between gap-3 border-b border-hairline bg-surface-2 px-4 py-2.5">
        <h2 className="text-xs font-medium tracking-widest text-text-secondary uppercase">
          {title}
        </h2>
        {meta && <div className="text-xs text-text-muted">{meta}</div>}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

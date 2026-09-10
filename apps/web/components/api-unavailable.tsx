/**
 * El backend corre como proceso persistente para que el scheduler siga vivo.
 * En planes con cold-start la primera petición tras un rato inactivo puede
 * caducar aunque el servicio esté sano, así que lo decimos en vez de mostrar
 * un error genérico.
 */
export function ApiUnavailable() {
  return (
    <div className="glass rise-in rounded-2xl p-10 text-center">
      <div className="flex items-center justify-center gap-2 text-sm">
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: 'var(--status-warning)', boxShadow: '0 0 8px var(--status-warning)' }}
        />
        <span className="text-text-muted">Sin conexión</span>
      </div>
      <h1 className="text-gradient mt-3 text-lg font-semibold">La API no responde ahora mismo</h1>
      <p className="mx-auto mt-2 max-w-prose text-sm text-text-secondary">
        El backend puede estar arrancando tras un periodo de inactividad. Si acabas de abrir
        el panel, espera unos segundos y recarga la página.
      </p>
      <p className="mt-4 text-xs text-text-muted">
        <span className="text-gradient font-medium">$</span> esperando respuesta del colector
        <span className="caret ml-1 align-middle" />
      </p>
    </div>
  );
}

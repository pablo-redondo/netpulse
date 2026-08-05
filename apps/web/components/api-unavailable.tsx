/**
 * El backend corre como proceso persistente para que el scheduler siga vivo.
 * En planes con cold-start la primera peticion tras un rato inactivo puede
 * caducar aunque el servicio este sano, asi que lo decimos en vez de mostrar
 * un error generico.
 */
export function ApiUnavailable() {
  return (
    <div className="rounded-lg border border-hairline bg-surface-1 p-8 text-center">
      <h1 className="text-lg font-semibold text-text-primary">
        La API no responde ahora mismo
      </h1>
      <p className="mx-auto mt-2 max-w-prose text-sm text-text-secondary">
        El backend puede estar arrancando tras un periodo de inactividad. Si acabas de
        abrir el panel, espera unos segundos y recarga la página.
      </p>
    </div>
  );
}

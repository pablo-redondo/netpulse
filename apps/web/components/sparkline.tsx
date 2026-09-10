interface SparklineProps {
  values: (number | null)[];
  width?: number;
  height?: number;
  label: string;
}

/**
 * Glifo de tendencia dentro de un stat tile: una sola serie, sin ejes ni
 * etiquetas. Los valores exactos viven en la pagina de detalle y en su tabla,
 * asi que este glifo nunca es la unica via para leer un dato.
 */
export function Sparkline({ values, width = 96, height = 28, label }: SparklineProps) {
  const points = values
    .map((value, index) => ({ value, index }))
    .filter((point): point is { value: number; index: number } => point.value !== null);

  if (points.length === 0) {
    return (
      <svg width={width} height={height} role="img" aria-label={`${label}: sin datos`}>
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="var(--gridline)"
          strokeWidth={1}
        />
      </svg>
    );
  }

  const padding = 4;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const maxIndex = Math.max(values.length - 1, 1);
  const min = Math.min(...points.map((p) => p.value));
  const max = Math.max(...points.map((p) => p.value));
  const span = max - min || 1;

  // Con una sola lectura no hay eje temporal que recorrer: se centra, para que
  // no se lea como un punto suelto pegado al borde.
  const toX = (index: number) =>
    points.length === 1 ? width / 2 : padding + (index / maxIndex) * innerWidth;
  const toY = (value: number) => padding + innerHeight - ((value - min) / span) * innerHeight;

  const path = points
    .map((point, i) => `${i === 0 ? 'M' : 'L'}${toX(point.index).toFixed(2)},${toY(point.value).toFixed(2)}`)
    .join(' ');

  const last = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label={`${label}: tendencia de ${points.length} puntos, último ${Math.round(last.value)} ms`}
    >
      {points.length > 1 && (
        <>
          {/* Halo tenue bajo el trazo */}
          <path
            d={path}
            fill="none"
            stroke="var(--series-1)"
            strokeWidth={5}
            strokeOpacity={0.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={path}
            fill="none"
            stroke="var(--series-1)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {/* Anillo en color de superficie: mantiene el punto legible al cruzar la línea */}
      <circle cx={toX(last.index)} cy={toY(last.value)} r={5} fill="var(--surface-1)" />
      <circle cx={toX(last.index)} cy={toY(last.value)} r={3.5} fill="var(--series-1)" />
    </svg>
  );
}

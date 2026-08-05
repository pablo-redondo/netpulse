import { CheckType } from '@netpulse/shared-types';

// Prueba de wiring del workspace: confirma que apps/web resuelve e importa
// @netpulse/shared-types correctamente. Sin UI real todavia (Paso 2).
const availableCheckTypes = Object.values(CheckType);

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-16 dark:bg-black">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">NetPulse</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Scaffold inicial. Tipos de check disponibles (via @netpulse/shared-types):{' '}
        {availableCheckTypes.join(', ')}
      </p>
    </main>
  );
}

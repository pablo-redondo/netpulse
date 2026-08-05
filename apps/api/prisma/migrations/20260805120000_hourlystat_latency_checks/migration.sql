-- AlterTable
ALTER TABLE "HourlyStat" ADD COLUMN "latencyChecks" INTEGER NOT NULL DEFAULT 0;

-- Backfill: en las filas ya existentes no sabemos cuantas comprobaciones
-- midieron latencia, pero las que la tienen midieron al menos una vez. La
-- mejor aproximacion disponible es asumir que fueron las correctas.
UPDATE "HourlyStat"
SET "latencyChecks" = "successChecks"
WHERE "avgLatencyMs" IS NOT NULL;

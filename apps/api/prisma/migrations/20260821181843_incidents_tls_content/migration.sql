-- AlterEnum
ALTER TYPE "CheckType" ADD VALUE 'TLS';

-- AlterTable
ALTER TABLE "CheckResult" ADD COLUMN     "certExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MonitoredService" ADD COLUMN     "expectedContent" TEXT;

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "cause" TEXT,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Incident_serviceId_resolvedAt_idx" ON "Incident"("serviceId", "resolvedAt");

-- CreateIndex
CREATE INDEX "Incident_startedAt_idx" ON "Incident"("startedAt" DESC);

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "MonitoredService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

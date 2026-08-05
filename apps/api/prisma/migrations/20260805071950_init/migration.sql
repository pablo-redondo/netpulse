-- CreateEnum
CREATE TYPE "CheckType" AS ENUM ('HTTP', 'DNS', 'TCP');

-- CreateTable
CREATE TABLE "MonitoredService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CheckType" NOT NULL,
    "target" TEXT NOT NULL,
    "vlanGroup" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonitoredService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckResult" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "latencyMs" INTEGER,
    "statusCode" INTEGER,
    "errorMessage" TEXT,

    CONSTRAINT "CheckResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HourlyStat" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "hourBucket" TIMESTAMP(3) NOT NULL,
    "totalChecks" INTEGER NOT NULL,
    "successChecks" INTEGER NOT NULL,
    "avgLatencyMs" DOUBLE PRECISION,

    CONSTRAINT "HourlyStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonitoredService_isActive_idx" ON "MonitoredService"("isActive");

-- CreateIndex
CREATE INDEX "CheckResult_serviceId_timestamp_idx" ON "CheckResult"("serviceId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "HourlyStat_serviceId_hourBucket_idx" ON "HourlyStat"("serviceId", "hourBucket" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "HourlyStat_serviceId_hourBucket_key" ON "HourlyStat"("serviceId", "hourBucket");

-- AddForeignKey
ALTER TABLE "CheckResult" ADD CONSTRAINT "CheckResult_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "MonitoredService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HourlyStat" ADD CONSTRAINT "HourlyStat_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "MonitoredService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

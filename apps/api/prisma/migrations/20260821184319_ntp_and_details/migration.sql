-- AlterEnum
ALTER TYPE "CheckType" ADD VALUE 'NTP';

-- AlterTable
ALTER TABLE "CheckResult" ADD COLUMN     "details" TEXT;

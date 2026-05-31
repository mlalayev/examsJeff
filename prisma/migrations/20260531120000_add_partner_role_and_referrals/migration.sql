-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PARTNER';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ReferralStatus" AS ENUM ('IN_PROGRESS', 'ACCEPTED', 'DECLINED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "referrals" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "studentFirstName" TEXT NOT NULL,
    "studentLastName" TEXT,
    "studentEmail" TEXT,
    "studentPhone" TEXT,
    "program" TEXT,
    "notes" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "monthlyPrice" DECIMAL(10,2),
    "commissionTiers" JSONB,
    "studentId" TEXT,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNotes" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "referrals_partnerId_status_idx" ON "referrals"("partnerId", "status");
CREATE INDEX IF NOT EXISTS "referrals_branchId_status_idx" ON "referrals"("branchId", "status");
CREATE INDEX IF NOT EXISTS "referrals_studentId_idx" ON "referrals"("studentId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "referrals" ADD CONSTRAINT "referrals_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "referrals" ADD CONSTRAINT "referrals_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "referrals" ADD CONSTRAINT "referrals_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "referrals" ADD CONSTRAINT "referrals_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

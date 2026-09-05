-- CreateEnum
CREATE TYPE "CrmContactStatus" AS ENUM (
    'WRITTEN',
    'INFO_PROVIDED',
    'TRIAL_ATTENDED',
    'ENROLLED'
);

-- AlterTable
ALTER TABLE "crm_contacts"
ADD COLUMN "status" "CrmContactStatus" NOT NULL DEFAULT 'WRITTEN',
DROP COLUMN "hasWritten";

-- CreateIndex
CREATE INDEX "crm_contacts_status_idx" ON "crm_contacts"("status");

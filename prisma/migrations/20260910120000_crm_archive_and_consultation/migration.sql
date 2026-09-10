-- CRM contacts foundation + archive + consultation booked rename.
-- Idempotent: safe on fresh DBs and existing production data.

-- 1) Create status enum if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CrmContactStatus') THEN
    CREATE TYPE "CrmContactStatus" AS ENUM (
      'WRITTEN',
      'CONSULTATION_BOOKED',
      'TRIAL_ATTENDED',
      'ENROLLED'
    );
  END IF;
END $$;

-- 2) Rename legacy INFO_PROVIDED → CONSULTATION_BOOKED when present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'CrmContactStatus'
      AND e.enumlabel = 'INFO_PROVIDED'
  ) THEN
    ALTER TYPE "CrmContactStatus" RENAME VALUE 'INFO_PROVIDED' TO 'CONSULTATION_BOOKED';
  END IF;
END $$;

-- 3) Ensure CONSULTATION_BOOKED exists even if enum was created without rename path
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CrmContactStatus')
     AND NOT EXISTS (
       SELECT 1
       FROM pg_enum e
       JOIN pg_type t ON e.enumtypid = t.oid
       WHERE t.typname = 'CrmContactStatus'
         AND e.enumlabel = 'CONSULTATION_BOOKED'
     ) THEN
    ALTER TYPE "CrmContactStatus" ADD VALUE IF NOT EXISTS 'CONSULTATION_BOOKED';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 4) Create table if missing (local/dev DBs that skipped earlier CRM migrations)
CREATE TABLE IF NOT EXISTS "crm_contacts" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "contactReason" TEXT NOT NULL,
    "status" "CrmContactStatus" NOT NULL DEFAULT 'WRITTEN',
    "email" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "notes" TEXT,
    "archivedAt" TIMESTAMP(3),
    "firstContactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_contacts_pkey" PRIMARY KEY ("id")
);

-- 5) Soft-archive + first contacted columns on existing tables (additive only)
ALTER TABLE "crm_contacts" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "crm_contacts" ADD COLUMN IF NOT EXISTS "firstContactedAt" TIMESTAMP(3);
ALTER TABLE "crm_contacts" ADD COLUMN IF NOT EXISTS "status" "CrmContactStatus" DEFAULT 'WRITTEN';

-- Backfill only — never deletes contact rows
UPDATE "crm_contacts"
SET "firstContactedAt" = COALESCE("firstContactedAt", "createdAt", CURRENT_TIMESTAMP)
WHERE "firstContactedAt" IS NULL;

ALTER TABLE "crm_contacts"
ALTER COLUMN "firstContactedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Make firstContactedAt NOT NULL only after backfill (safe; no row deletes)
DO $$
BEGIN
  UPDATE "crm_contacts"
  SET "firstContactedAt" = COALESCE("firstContactedAt", "createdAt", CURRENT_TIMESTAMP)
  WHERE "firstContactedAt" IS NULL;
  ALTER TABLE "crm_contacts" ALTER COLUMN "firstContactedAt" SET NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

UPDATE "crm_contacts" SET "status" = 'WRITTEN' WHERE "status" IS NULL;
ALTER TABLE "crm_contacts" ALTER COLUMN "status" SET DEFAULT 'WRITTEN';
DO $$
BEGIN
  ALTER TABLE "crm_contacts" ALTER COLUMN "status" SET NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- 6) Indexes & FK
CREATE INDEX IF NOT EXISTS "crm_contacts_createdAt_idx" ON "crm_contacts"("createdAt");
CREATE INDEX IF NOT EXISTS "crm_contacts_firstContactedAt_idx" ON "crm_contacts"("firstContactedAt");
CREATE INDEX IF NOT EXISTS "crm_contacts_status_idx" ON "crm_contacts"("status");
CREATE INDEX IF NOT EXISTS "crm_contacts_archivedAt_idx" ON "crm_contacts"("archivedAt");
CREATE INDEX IF NOT EXISTS "crm_contacts_phoneNumber_idx" ON "crm_contacts"("phoneNumber");
CREATE INDEX IF NOT EXISTS "crm_contacts_email_idx" ON "crm_contacts"("email");
CREATE INDEX IF NOT EXISTS "crm_contacts_contactReason_idx" ON "crm_contacts"("contactReason");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_contacts_createdById_fkey'
  ) THEN
    ALTER TABLE "crm_contacts"
      ADD CONSTRAINT "crm_contacts_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

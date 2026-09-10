import { prisma } from "@/lib/prisma";

let ensurePromise: Promise<void> | null = null;

/**
 * Idempotent CRM schema repair. Only additive / safe operations —
 * never drops data. Used when migrate deploy is stuck.
 */
export async function ensureCrmContactsSchema(): Promise<void> {
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    await prisma.$executeRawUnsafe(`
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
`);

    // Rename legacy enum value if present (preserves existing row values)
    await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'CrmContactStatus'
      AND e.enumlabel = 'INFO_PROVIDED'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'CrmContactStatus'
      AND e.enumlabel = 'CONSULTATION_BOOKED'
  ) THEN
    ALTER TYPE "CrmContactStatus" RENAME VALUE 'INFO_PROVIDED' TO 'CONSULTATION_BOOKED';
  END IF;
END $$;
`);

    // Add CONSULTATION_BOOKED if somehow missing while INFO_PROVIDED already gone
    await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CrmContactStatus')
     AND NOT EXISTS (
       SELECT 1 FROM pg_enum e
       JOIN pg_type t ON e.enumtypid = t.oid
       WHERE t.typname = 'CrmContactStatus' AND e.enumlabel = 'CONSULTATION_BOOKED'
     ) THEN
    ALTER TYPE "CrmContactStatus" ADD VALUE IF NOT EXISTS 'CONSULTATION_BOOKED';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN others THEN NULL;
END $$;
`);

    await prisma.$executeRawUnsafe(`
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
    "firstContactedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_contacts_pkey" PRIMARY KEY ("id")
);
`);

    await prisma.$executeRawUnsafe(
      `ALTER TABLE "crm_contacts" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3)`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "crm_contacts" ADD COLUMN IF NOT EXISTS "firstContactedAt" TIMESTAMP(3)`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "crm_contacts" ADD COLUMN IF NOT EXISTS "createdById" TEXT`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "crm_contacts" ADD COLUMN IF NOT EXISTS "notes" TEXT`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "crm_contacts" ADD COLUMN IF NOT EXISTS "email" TEXT`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "crm_contacts" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3)`
    );

    // Backfill firstContactedAt from createdAt — never deletes rows
    await prisma.$executeRawUnsafe(`
UPDATE "crm_contacts"
SET "firstContactedAt" = COALESCE("firstContactedAt", "createdAt", CURRENT_TIMESTAMP)
WHERE "firstContactedAt" IS NULL
`);

    await prisma.$executeRawUnsafe(`
ALTER TABLE "crm_contacts"
ALTER COLUMN "firstContactedAt" SET DEFAULT CURRENT_TIMESTAMP
`);

    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "crm_contacts_createdAt_idx" ON "crm_contacts"("createdAt")`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "crm_contacts_firstContactedAt_idx" ON "crm_contacts"("firstContactedAt")`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "crm_contacts_status_idx" ON "crm_contacts"("status")`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "crm_contacts_archivedAt_idx" ON "crm_contacts"("archivedAt")`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "crm_contacts_phoneNumber_idx" ON "crm_contacts"("phoneNumber")`
    );

    await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_contacts_createdById_fkey'
  ) THEN
    BEGIN
      ALTER TABLE "crm_contacts"
        ADD CONSTRAINT "crm_contacts_createdById_fkey"
        FOREIGN KEY ("createdById") REFERENCES "users"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION
      WHEN others THEN NULL;
    END;
  END IF;
END $$;
`);
  })().catch((err) => {
    ensurePromise = null;
    throw err;
  });

  return ensurePromise;
}

export function crmPrismaErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const code = "code" in error ? String((error as { code?: string }).code || "") : "";
  const meta = (error as { meta?: { column?: string; field_name?: string } }).meta;
  const message =
    "message" in error && typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message
      : "";

  if (code === "P2021") {
    return "CRM table is missing. Refresh once — schema repair runs automatically.";
  }
  if (code === "P2022") {
    const col = meta?.column || meta?.field_name || "a required column";
    return `CRM schema is outdated (missing ${col}). Refresh once to repair.`;
  }
  if (code === "P2003") {
    return "Could not link contact creator. Contact was not saved with creator link.";
  }
  if (code === "P2002") {
    return "A contact with this unique value already exists.";
  }
  if (message.includes("INFO_PROVIDED") || message.includes("CONSULTATION_BOOKED")) {
    return "CRM status enum is outdated. Refresh once to repair schema.";
  }
  if (code.startsWith("P") || message) {
    return (message || "Database error").slice(0, 280);
  }
  return null;
}

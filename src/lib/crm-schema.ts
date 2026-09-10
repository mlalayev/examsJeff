import { prisma } from "@/lib/prisma";

let ensurePromise: Promise<void> | null = null;

/**
 * Idempotent CRM schema repair for environments where `prisma migrate deploy`
 * is stuck on an older failed migration. Safe to call on every CRM request.
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

    await prisma.$executeRawUnsafe(`
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
    "firstContactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
      `ALTER TABLE "crm_contacts" ADD COLUMN IF NOT EXISTS "status" "CrmContactStatus" DEFAULT 'WRITTEN'`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "crm_contacts" DROP COLUMN IF EXISTS "hasWritten"`
    );

    await prisma.$executeRawUnsafe(`
UPDATE "crm_contacts"
SET "firstContactedAt" = COALESCE("firstContactedAt", "createdAt", CURRENT_TIMESTAMP)
WHERE "firstContactedAt" IS NULL
`);

    await prisma.$executeRawUnsafe(`
ALTER TABLE "crm_contacts"
ALTER COLUMN "firstContactedAt" SET DEFAULT CURRENT_TIMESTAMP
`);

    // NOT NULL only after backfill
    await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_contacts' AND column_name = 'firstContactedAt'
  ) THEN
    UPDATE "crm_contacts"
    SET "firstContactedAt" = COALESCE("firstContactedAt", "createdAt", CURRENT_TIMESTAMP)
    WHERE "firstContactedAt" IS NULL;
    ALTER TABLE "crm_contacts" ALTER COLUMN "firstContactedAt" SET NOT NULL;
  END IF;
END $$;
`);

    await prisma.$executeRawUnsafe(`
UPDATE "crm_contacts" SET "status" = 'WRITTEN' WHERE "status" IS NULL
`);

    await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_contacts' AND column_name = 'status'
  ) THEN
    ALTER TABLE "crm_contacts" ALTER COLUMN "status" SET DEFAULT 'WRITTEN';
    BEGIN
      ALTER TABLE "crm_contacts" ALTER COLUMN "status" SET NOT NULL;
    EXCEPTION WHEN others THEN NULL;
    END;
  END IF;
END $$;
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
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "crm_contacts_email_idx" ON "crm_contacts"("email")`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "crm_contacts_contactReason_idx" ON "crm_contacts"("contactReason")`
    );

    await prisma.$executeRawUnsafe(`
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
`);
  })().catch((err) => {
    // Allow a later request to retry if ensure failed once.
    ensurePromise = null;
    throw err;
  });

  return ensurePromise;
}

export function crmPrismaErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const code = "code" in error ? String((error as { code?: string }).code || "") : "";
  const meta = (error as { meta?: { column?: string; field_name?: string; cause?: string } })
    .meta;

  if (code === "P2021") {
    return "CRM table is missing. Schema repair failed — run CRM migrations.";
  }
  if (code === "P2022") {
    const col = meta?.column || meta?.field_name || "unknown column";
    return `CRM schema is outdated (missing ${col}). Refresh and retry; schema repair runs automatically.`;
  }
  if (code === "P2003") {
    return "Could not link contact creator. Try again, or contact support if it persists.";
  }
  if (code === "P2002") {
    return "A contact with this unique value already exists.";
  }
  if (code.startsWith("P")) {
    const msg =
      "message" in error && typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message
        : "Database error";
    return msg.slice(0, 240);
  }
  return null;
}

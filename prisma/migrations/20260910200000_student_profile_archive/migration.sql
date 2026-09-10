-- Soft-archive for finished students (visibility only; history preserved).
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "student_profiles_archivedAt_idx" ON "student_profiles"("archivedAt");

-- AlterTable: add student kind + study status to student_profiles
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "studentKind" TEXT NOT NULL DEFAULT 'STUDENT';
ALTER TABLE "student_profiles" ADD COLUMN IF NOT EXISTS "studyStatus" TEXT NOT NULL DEFAULT 'CONTINUES';

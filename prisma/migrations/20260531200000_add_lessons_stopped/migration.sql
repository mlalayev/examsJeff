-- AlterTable
ALTER TABLE "student_profiles"
  ADD COLUMN "lessonsStopped" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "lessonsStoppedAt" TIMESTAMP(3);

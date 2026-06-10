-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN "studyTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "student_profiles" ADD COLUMN "lessonModes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

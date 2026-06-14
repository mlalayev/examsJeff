-- CreateEnum
CREATE TYPE "PerformanceRating" AS ENUM ('EXCELLENT', 'GOOD', 'AVERAGE', 'WEAK', 'DID_NOT_PARTICIPATE');

-- AlterTable
ALTER TABLE "lesson_sessions" ADD COLUMN "topic" TEXT;

-- AlterTable
ALTER TABLE "lesson_student_records" ADD COLUMN "performance" "PerformanceRating";

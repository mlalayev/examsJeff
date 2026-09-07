-- AlterEnum
ALTER TYPE "ExamCategory" ADD VALUE 'PLACEMENT';

-- AlterTable
ALTER TABLE "questions" ADD COLUMN "cefrLevel" TEXT;

-- AlterTable
ALTER TABLE "attempts" ADD COLUMN "placementLevel" TEXT;
ALTER TABLE "attempts" ADD COLUMN "placementBreakdown" JSONB;

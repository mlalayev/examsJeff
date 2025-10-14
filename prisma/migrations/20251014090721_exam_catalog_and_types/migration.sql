/*
  Warnings:

  - You are about to drop the column `examType` on the `exams` table. All the data in the column will be lost.
  - You are about to drop the column `sectionType` on the `questions` table. All the data in the column will be lost.
  - Added the required column `examId` to the `attempts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `attempts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `exam_sections` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sectionId` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `qtype` on the `questions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ExamCategory" AS ENUM ('IELTS', 'TOEFL', 'SAT', 'KIDS', 'GENERAL_ENGLISH', 'MATH');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'TF', 'GAP', 'ORDER', 'DND_MATCH', 'SHORT_TEXT', 'ESSAY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SectionType" ADD VALUE 'GRAMMAR';
ALTER TYPE "SectionType" ADD VALUE 'VOCABULARY';

-- DropForeignKey
ALTER TABLE "public"."questions" DROP CONSTRAINT "questions_examId_fkey";

-- AlterTable
ALTER TABLE "attempt_sections" ADD COLUMN     "maxScore" INTEGER,
ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "attempts" ADD COLUMN     "examId" TEXT NOT NULL,
ADD COLUMN     "studentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "exam_sections" ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "durationMin" SET DEFAULT 15;

-- AlterTable
ALTER TABLE "exams" DROP COLUMN "examType",
ADD COLUMN     "category" "ExamCategory" NOT NULL DEFAULT 'IELTS',
ADD COLUMN     "track" TEXT;

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "sectionType",
ADD COLUMN     "explanation" JSONB,
ADD COLUMN     "sectionId" TEXT NOT NULL,
ALTER COLUMN "examId" DROP NOT NULL,
DROP COLUMN "qtype",
ADD COLUMN     "qtype" "QuestionType" NOT NULL;

-- CreateTable
CREATE TABLE "exam_assignments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "sections" "SectionType"[],
    "startAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exam_assignments_studentId_examId_idx" ON "exam_assignments"("studentId", "examId");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "exam_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_assignments" ADD CONSTRAINT "exam_assignments_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

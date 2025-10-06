/*
  Warnings:

  - You are about to drop the column `examId` on the `attempts` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `attempts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bookingId]` on the table `attempts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bookingId` to the `attempts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."attempts" DROP CONSTRAINT "attempts_studentId_fkey";

-- AlterTable
ALTER TABLE "attempts" DROP COLUMN "examId",
DROP COLUMN "studentId",
ADD COLUMN     "bookingId" TEXT NOT NULL,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS';

-- CreateTable
CREATE TABLE "attempt_sections" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "type" "SectionType" NOT NULL,
    "answers" JSONB,
    "rawScore" INTEGER,
    "bandScore" DOUBLE PRECISION,
    "gradedById" TEXT,
    "rubric" JSONB,
    "feedback" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',

    CONSTRAINT "attempt_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attempts_bookingId_key" ON "attempts"("bookingId");

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_sections" ADD CONSTRAINT "attempt_sections_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

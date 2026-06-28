-- AlterTable
ALTER TABLE "exams" ADD COLUMN "isHomework" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "assignments" ALTER COLUMN "unitExamId" DROP NOT NULL;
ALTER TABLE "assignments" ADD COLUMN "examId" TEXT;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "assignments_examId_idx" ON "assignments"("examId");

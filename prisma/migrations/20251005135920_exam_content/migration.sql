-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "examType" TEXT NOT NULL DEFAULT 'IELTS';

-- CreateTable
CREATE TABLE "exam_sections" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "type" "SectionType" NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "exam_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "sectionType" "SectionType" NOT NULL,
    "qtype" TEXT NOT NULL,
    "prompt" JSONB NOT NULL,
    "options" JSONB,
    "answerKey" JSONB,
    "maxScore" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "band_maps" (
    "id" TEXT NOT NULL,
    "examType" TEXT NOT NULL,
    "section" "SectionType" NOT NULL,
    "minRaw" INTEGER NOT NULL,
    "maxRaw" INTEGER NOT NULL,
    "band" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "band_maps_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "exam_sections" ADD CONSTRAINT "exam_sections_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

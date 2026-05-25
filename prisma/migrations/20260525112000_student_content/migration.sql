-- CreateEnum
CREATE TYPE "LessonCategory" AS ENUM ('IELTS', 'TOEFL', 'SAT', 'GENERAL_ENGLISH', 'KIDS');

-- CreateEnum
CREATE TYPE "LessonProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "WordListCategory" AS ENUM ('GENERAL', 'SAT', 'IELTS');

-- CreateEnum
CREATE TYPE "WordReviewStatus" AS ENUM ('NEW', 'LEARNING', 'REVIEW', 'MASTERED');

-- CreateEnum
CREATE TYPE "TrickCategory" AS ENUM ('WRITING', 'DESMOS');

-- AlterTable
ALTER TABLE "assignments" ADD COLUMN "isExtra" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "assignments_studentId_isExtra_status_idx" ON "assignments"("studentId", "isExtra", "status");

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "LessonCategory" NOT NULL,
    "level" TEXT,
    "summary" TEXT,
    "content" JSONB,
    "coverImage" TEXT,
    "videoUrl" TEXT,
    "durationMin" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "LessonProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "word_lists" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "WordListCategory" NOT NULL,
    "level" TEXT,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "word_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "words" (
    "id" TEXT NOT NULL,
    "wordListId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "partOfSpeech" TEXT,
    "example" TEXT,
    "synonyms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audioUrl" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "word_reviews" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "WordReviewStatus" NOT NULL DEFAULT 'NEW',
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3),
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "word_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tricks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "TrickCategory" NOT NULL,
    "summary" TEXT,
    "content" JSONB,
    "coverImage" TEXT,
    "videoUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tricks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trick_saves" (
    "id" TEXT NOT NULL,
    "trickId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trick_saves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lessons_slug_key" ON "lessons"("slug");

-- CreateIndex
CREATE INDEX "lessons_category_isPublished_order_idx" ON "lessons"("category", "isPublished", "order");

-- CreateIndex
CREATE INDEX "lessons_createdById_idx" ON "lessons"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_lessonId_studentId_key" ON "lesson_progress"("lessonId", "studentId");

-- CreateIndex
CREATE INDEX "lesson_progress_studentId_status_idx" ON "lesson_progress"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "word_lists_slug_key" ON "word_lists"("slug");

-- CreateIndex
CREATE INDEX "word_lists_category_isPublished_order_idx" ON "word_lists"("category", "isPublished", "order");

-- CreateIndex
CREATE INDEX "word_lists_createdById_idx" ON "word_lists"("createdById");

-- CreateIndex
CREATE INDEX "words_wordListId_order_idx" ON "words"("wordListId", "order");

-- CreateIndex
CREATE INDEX "words_term_idx" ON "words"("term");

-- CreateIndex
CREATE UNIQUE INDEX "word_reviews_wordId_studentId_key" ON "word_reviews"("wordId", "studentId");

-- CreateIndex
CREATE INDEX "word_reviews_studentId_status_idx" ON "word_reviews"("studentId", "status");

-- CreateIndex
CREATE INDEX "word_reviews_studentId_nextReviewAt_idx" ON "word_reviews"("studentId", "nextReviewAt");

-- CreateIndex
CREATE UNIQUE INDEX "tricks_slug_key" ON "tricks"("slug");

-- CreateIndex
CREATE INDEX "tricks_category_isPublished_order_idx" ON "tricks"("category", "isPublished", "order");

-- CreateIndex
CREATE INDEX "tricks_createdById_idx" ON "tricks"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "trick_saves_trickId_studentId_key" ON "trick_saves"("trickId", "studentId");

-- CreateIndex
CREATE INDEX "trick_saves_studentId_idx" ON "trick_saves"("studentId");

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_lists" ADD CONSTRAINT "word_lists_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "words" ADD CONSTRAINT "words_wordListId_fkey" FOREIGN KEY ("wordListId") REFERENCES "word_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_reviews" ADD CONSTRAINT "word_reviews_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_reviews" ADD CONSTRAINT "word_reviews_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tricks" ADD CONSTRAINT "tricks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trick_saves" ADD CONSTRAINT "trick_saves_trickId_fkey" FOREIGN KEY ("trickId") REFERENCES "tricks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trick_saves" ADD CONSTRAINT "trick_saves_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

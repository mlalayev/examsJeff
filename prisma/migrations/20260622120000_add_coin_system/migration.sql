-- CreateEnum
CREATE TYPE "CoinTransactionType" AS ENUM ('EARNED', 'MANUAL_ADD', 'MANUAL_DEDUCT');

-- CreateEnum
CREATE TYPE "CoinTransactionSource" AS ENUM ('EXAM_SCORE', 'ADMIN_ACTION');

-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN "coinBalance" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "coin_transactions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "CoinTransactionType" NOT NULL,
    "reason" TEXT,
    "source" "CoinTransactionSource" NOT NULL,
    "examAttemptId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coin_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coin_transactions_studentId_createdAt_idx" ON "coin_transactions"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "coin_transactions_type_createdAt_idx" ON "coin_transactions"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "unique_student_exam_coin_type" ON "coin_transactions"("studentId", "examAttemptId", "type");

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_examAttemptId_fkey" FOREIGN KEY ("examAttemptId") REFERENCES "attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

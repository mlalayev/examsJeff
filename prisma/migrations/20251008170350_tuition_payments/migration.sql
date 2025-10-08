-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'UNPAID');

-- CreateTable
CREATE TABLE "tuition_payments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paidAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tuition_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tuition_payments_branchId_year_month_idx" ON "tuition_payments"("branchId", "year", "month");

-- CreateIndex
CREATE INDEX "tuition_payments_status_year_month_idx" ON "tuition_payments"("status", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "tuition_payments_studentId_year_month_key" ON "tuition_payments"("studentId", "year", "month");

-- AddForeignKey
ALTER TABLE "tuition_payments" ADD CONSTRAINT "tuition_payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tuition_payments" ADD CONSTRAINT "tuition_payments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

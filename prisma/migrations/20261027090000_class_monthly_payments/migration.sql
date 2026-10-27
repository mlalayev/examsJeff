ALTER TABLE "class_students" ADD COLUMN "monthlyFee" DECIMAL(10,2), ADD COLUMN "paymentDueDay" INTEGER NOT NULL DEFAULT 10;
CREATE TABLE "class_monthly_payments" (
 "id" TEXT NOT NULL PRIMARY KEY, "classId" TEXT NOT NULL, "studentId" TEXT NOT NULL, "teacherId" TEXT NOT NULL,
 "year" INTEGER NOT NULL, "month" INTEGER NOT NULL, "expected" DECIMAL(10,2) NOT NULL, "paid" DECIMAL(10,2) NOT NULL DEFAULT 0,
 "dueDate" DATE NOT NULL, "paidAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "class_payment_amounts" CHECK ("expected" >= 0 AND "paid" >= 0 AND "paid" <= "expected"),
 CONSTRAINT "class_payment_month" CHECK ("month" BETWEEN 1 AND 12)
);
CREATE UNIQUE INDEX "class_monthly_payments_classId_studentId_year_month_key" ON "class_monthly_payments"("classId","studentId","year","month");
CREATE INDEX "class_monthly_payments_teacherId_year_month_idx" ON "class_monthly_payments"("teacherId","year","month");
CREATE INDEX "class_monthly_payments_studentId_year_month_idx" ON "class_monthly_payments"("studentId","year","month");

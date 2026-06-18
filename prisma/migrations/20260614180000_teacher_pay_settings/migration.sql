-- CreateEnum
CREATE TYPE "TeacherPayType" AS ENUM ('PER_LESSON', 'HOURLY', 'FIXED');

-- CreateTable
CREATE TABLE "teacher_pay_settings" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "payType" "TeacherPayType" NOT NULL DEFAULT 'PER_LESSON',
    "rate" DECIMAL(10,2),
    "fixedAmount" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_pay_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teacher_pay_settings_teacherId_key" ON "teacher_pay_settings"("teacherId");

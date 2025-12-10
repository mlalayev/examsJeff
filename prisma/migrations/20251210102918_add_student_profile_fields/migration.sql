/*
  Warnings:

  - Added the required column `dateOfBirth` to the `student_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `student_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `program` to the `student_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN     "dateOfBirth" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "paymentAmount" DECIMAL(10,2),
ADD COLUMN     "paymentDate" TIMESTAMP(3),
ADD COLUMN     "phoneNumber" TEXT NOT NULL,
ADD COLUMN     "program" TEXT NOT NULL;

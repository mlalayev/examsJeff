/*
  Warnings:

  - You are about to drop the `exam_set_exams` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `exam_sets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_exam_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_exam_set_assignments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."exam_set_exams" DROP CONSTRAINT "exam_set_exams_examId_fkey";

-- DropForeignKey
ALTER TABLE "public"."exam_set_exams" DROP CONSTRAINT "exam_set_exams_examSetId_fkey";

-- DropForeignKey
ALTER TABLE "public"."exam_sets" DROP CONSTRAINT "exam_sets_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_exam_permissions" DROP CONSTRAINT "student_exam_permissions_examId_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_exam_permissions" DROP CONSTRAINT "student_exam_permissions_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_exam_permissions" DROP CONSTRAINT "student_exam_permissions_unlockedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_exam_set_assignments" DROP CONSTRAINT "student_exam_set_assignments_assignedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_exam_set_assignments" DROP CONSTRAINT "student_exam_set_assignments_branchId_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_exam_set_assignments" DROP CONSTRAINT "student_exam_set_assignments_examSetId_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_exam_set_assignments" DROP CONSTRAINT "student_exam_set_assignments_studentId_fkey";

-- DropTable
DROP TABLE "public"."exam_set_exams";

-- DropTable
DROP TABLE "public"."exam_sets";

-- DropTable
DROP TABLE "public"."student_exam_permissions";

-- DropTable
DROP TABLE "public"."student_exam_set_assignments";

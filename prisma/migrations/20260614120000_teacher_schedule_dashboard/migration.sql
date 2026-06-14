-- CreateEnum
CREATE TYPE "ScheduleDayType" AS ENUM ('ODD', 'EVEN');

-- CreateEnum
CREATE TYPE "LessonSessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "HomeworkStatus" AS ENUM ('NOT_ASSIGNED', 'ASSIGNED', 'COMPLETED', 'INCOMPLETE', 'NOT_DONE');

-- CreateTable
CREATE TABLE "schedule_slots" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT,
    "branchId" TEXT,
    "dayType" "ScheduleDayType" NOT NULL,
    "title" TEXT NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "hourlyRate" DECIMAL(10,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_sessions" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT,
    "branchId" TEXT,
    "scheduleSlotId" TEXT,
    "title" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "status" "LessonSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "hourlyRate" DECIMAL(10,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_student_records" (
    "id" TEXT NOT NULL,
    "lessonSessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT,
    "teacherId" TEXT NOT NULL,
    "attendance" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "homeworkStatus" "HomeworkStatus" NOT NULL DEFAULT 'NOT_ASSIGNED',
    "feedback" TEXT,
    "teacherNote" TEXT,
    "behaviorNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_student_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedule_slots_teacherId_dayType_idx" ON "schedule_slots"("teacherId", "dayType");

-- CreateIndex
CREATE INDEX "schedule_slots_classId_idx" ON "schedule_slots"("classId");

-- CreateIndex
CREATE INDEX "schedule_slots_branchId_idx" ON "schedule_slots"("branchId");

-- CreateIndex
CREATE INDEX "lesson_sessions_teacherId_date_idx" ON "lesson_sessions"("teacherId", "date");

-- CreateIndex
CREATE INDEX "lesson_sessions_classId_date_idx" ON "lesson_sessions"("classId", "date");

-- CreateIndex
CREATE INDEX "lesson_sessions_branchId_date_idx" ON "lesson_sessions"("branchId", "date");

-- CreateIndex
CREATE INDEX "lesson_sessions_scheduleSlotId_idx" ON "lesson_sessions"("scheduleSlotId");

-- CreateIndex
CREATE INDEX "lesson_student_records_studentId_createdAt_idx" ON "lesson_student_records"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "lesson_student_records_teacherId_createdAt_idx" ON "lesson_student_records"("teacherId", "createdAt");

-- CreateIndex
CREATE INDEX "lesson_student_records_classId_idx" ON "lesson_student_records"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_student_records_lessonSessionId_studentId_key" ON "lesson_student_records"("lessonSessionId", "studentId");

-- AddForeignKey
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_sessions" ADD CONSTRAINT "lesson_sessions_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_sessions" ADD CONSTRAINT "lesson_sessions_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_sessions" ADD CONSTRAINT "lesson_sessions_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_sessions" ADD CONSTRAINT "lesson_sessions_scheduleSlotId_fkey" FOREIGN KEY ("scheduleSlotId") REFERENCES "schedule_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_student_records" ADD CONSTRAINT "lesson_student_records_lessonSessionId_fkey" FOREIGN KEY ("lessonSessionId") REFERENCES "lesson_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_student_records" ADD CONSTRAINT "lesson_student_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_student_records" ADD CONSTRAINT "lesson_student_records_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_student_records" ADD CONSTRAINT "lesson_student_records_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

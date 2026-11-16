CREATE TABLE "daily_reports" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "subject" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "daily_reports_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "daily_reports_teacherId_classId_studentId_day_key" ON "daily_reports"("teacherId", "classId", "studentId", "day");
CREATE INDEX "daily_reports_teacherId_day_idx" ON "daily_reports"("teacherId", "day");

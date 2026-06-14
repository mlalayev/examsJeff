-- CreateTable
CREATE TABLE "weekly_reports" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "subject" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_reports_teacherId_classId_studentId_weekStart_key" ON "weekly_reports"("teacherId", "classId", "studentId", "weekStart");

-- CreateIndex
CREATE INDEX "weekly_reports_teacherId_weekStart_idx" ON "weekly_reports"("teacherId", "weekStart");

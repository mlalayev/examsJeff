-- CreateTable
CREATE TABLE "student_enrollments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "courseType" TEXT NOT NULL,
    "level" TEXT,
    "branchId" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_schedules" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "notes" TEXT,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_enrollments_studentId_status_idx" ON "student_enrollments"("studentId", "status");

-- CreateIndex
CREATE INDEX "student_enrollments_branchId_status_idx" ON "student_enrollments"("branchId", "status");

-- CreateIndex
CREATE INDEX "payment_schedules_studentId_dueDate_idx" ON "payment_schedules"("studentId", "dueDate");

-- CreateIndex
CREATE INDEX "payment_schedules_branchId_dueDate_idx" ON "payment_schedules"("branchId", "dueDate");

-- CreateIndex
CREATE INDEX "payment_schedules_status_dueDate_idx" ON "payment_schedules"("status", "dueDate");

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

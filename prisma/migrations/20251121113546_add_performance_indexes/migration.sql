-- CreateIndex
CREATE INDEX "attempt_sections_attemptId_type_idx" ON "attempt_sections"("attemptId", "type");

-- CreateIndex
CREATE INDEX "attempts_studentId_status_idx" ON "attempts"("studentId", "status");

-- CreateIndex
CREATE INDEX "attempts_studentId_createdAt_idx" ON "attempts"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "attempts_status_createdAt_idx" ON "attempts"("status", "createdAt");

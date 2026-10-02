-- No backfill: existing attempts remain outside the new policy.
CREATE TABLE "exam_integrity" (
  "attemptId" TEXT PRIMARY KEY REFERENCES "attempts"("id") ON DELETE CASCADE,
  "policyVersion" INTEGER NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'PENDING',
  "acceptedAt" TIMESTAMP(3), "invalidatedAt" TIMESTAMP(3),
  "reviewNote" TEXT, "reviewedById" TEXT, "reviewedAt" TIMESTAMP(3)
);
CREATE TABLE "exam_integrity_events" (
  "id" TEXT PRIMARY KEY, "attemptId" TEXT NOT NULL REFERENCES "exam_integrity"("attemptId") ON DELETE CASCADE,
  "kind" TEXT NOT NULL, "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "metadata" JSONB
);
CREATE INDEX "exam_integrity_events_attemptId_occurredAt_idx" ON "exam_integrity_events"("attemptId", "occurredAt");
CREATE TABLE "writing_originality_reviews" (
  "attemptId" TEXT PRIMARY KEY, "state" TEXT NOT NULL DEFAULT 'NOT_CHECKED',
  "sourceHash" TEXT, "result" JSONB, "requestedBy" TEXT, "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Last-line race protection: a concurrent submit/grading request must never
-- resurrect an invalid attempt, even after an earlier application-level check.
CREATE FUNCTION prevent_invalid_attempt_result() RETURNS trigger AS $$
BEGIN
  IF NEW.status IN ('SUBMITTED', 'COMPLETED') AND EXISTS
    (SELECT 1 FROM exam_integrity WHERE "attemptId" = NEW.id AND state IN ('PENDING', 'INVALID')) THEN
    RAISE EXCEPTION 'Exam preflight required or attempt invalidated';
  END IF;
  IF OLD.status = 'DISQUALIFIED' AND
    (NEW.status IS DISTINCT FROM OLD.status OR NEW."bandOverall" IS DISTINCT FROM OLD."bandOverall" OR NEW.answers IS DISTINCT FROM OLD.answers) THEN
    RAISE EXCEPTION 'Invalidated exam attempts cannot be scored or submitted';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER prevent_invalid_attempt_result BEFORE UPDATE ON "attempts"
FOR EACH ROW EXECUTE FUNCTION prevent_invalid_attempt_result();

CREATE FUNCTION prevent_invalid_exam_write() RETURNS trigger AS $$
DECLARE attempt_status TEXT;
BEGIN
  SELECT status INTO attempt_status FROM attempts WHERE id = NEW."attemptId" FOR UPDATE;
  IF attempt_status = 'DISQUALIFIED' THEN
    RAISE EXCEPTION 'Invalidated exam attempts are read-only';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER prevent_invalid_answer_write BEFORE INSERT OR UPDATE ON attempt_answers
FOR EACH ROW EXECUTE FUNCTION prevent_invalid_exam_write();
CREATE TRIGGER prevent_invalid_section_write BEFORE INSERT OR UPDATE ON attempt_sections
FOR EACH ROW EXECUTE FUNCTION prevent_invalid_exam_write();
CREATE TRIGGER prevent_invalid_writing_write BEFORE INSERT OR UPDATE ON writing_submissions
FOR EACH ROW EXECUTE FUNCTION prevent_invalid_exam_write();

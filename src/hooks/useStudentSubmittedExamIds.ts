"use client";

import { useEffect, useState } from "react";

/**
 * Loads exam IDs the student has already submitted (completed), for Assign Exam UI.
 */
export function useStudentSubmittedExamIds(studentId: string | null, enabled: boolean) {
  const [submittedExamIds, setSubmittedExamIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !studentId) {
      setSubmittedExamIds(new Set());
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/admin/students/${studentId}/exams`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const next = new Set<string>();
        for (const row of data.exams ?? []) {
          if (row.status === "SUBMITTED" && row.examId) next.add(row.examId);
        }
        setSubmittedExamIds(next);
      })
      .catch(() => {
        if (!cancelled) setSubmittedExamIds(new Set());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [studentId, enabled]);

  return { submittedExamIds, loading };
}

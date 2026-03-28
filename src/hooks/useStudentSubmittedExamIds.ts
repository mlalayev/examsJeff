"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { studentExamsApiUrl } from "@/lib/student-exams-api";

/**
 * Loads exam IDs the student has already submitted (completed), for Assign Exam UI.
 */
export function useStudentSubmittedExamIds(studentId: string | null, enabled: boolean) {
  const pathname = usePathname();
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

    fetch(studentExamsApiUrl(studentId, pathname))
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
  }, [studentId, enabled, pathname]);

  return { submittedExamIds, loading };
}

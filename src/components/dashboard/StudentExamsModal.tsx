"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ExternalLink, Loader2 } from "lucide-react";
import { studentExamsApiUrl } from "@/lib/student-exams-api";
import { attemptRunnerPath } from "@/lib/attempt-runner-path";

export type StudentExamsModalStudent = {
  id: string;
  name: string | null;
  email: string;
};

type ExamRow = {
  attemptId: string;
  examId: string;
  examTitle: string;
  category: string | null;
  track: string | null;
  status: string;
  createdAt: string;
  submittedAt: string | null;
  bookingId: string | null;
  assignedAt: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  student: StudentExamsModalStudent | null;
};

export default function StudentExamsModal({ open, onClose, student }: Props) {
  const pathname = usePathname();
  const [rows, setRows] = useState<ExamRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !student?.id) {
      setRows([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(studentExamsApiUrl(student.id, pathname))
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        return data.exams as ExamRow[];
      })
      .then((exams) => {
        if (!cancelled) setRows(exams || []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, student?.id, pathname]);

  if (!open || !student) return null;

  const hrefForAttempt = (
    attemptId: string,
    status: string,
    category: string | null | undefined
  ) =>
    status === "SUBMITTED"
      ? `/attempts/${attemptId}/results`
      : attemptRunnerPath(attemptId, category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Student exams</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {student.name || student.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading exams…
            </div>
          ) : error ? (
            <p className="text-red-600 text-sm py-4">{error}</p>
          ) : rows.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No exam attempts yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-700">Exam</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700">Status</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700">Started</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700">Submitted</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-700">Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <tr key={r.attemptId} className="hover:bg-gray-50/80">
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{r.examTitle}</div>
                        <div className="text-xs text-gray-500">
                          {[r.category, r.track].filter(Boolean).join(" · ") || "—"}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                        {r.submittedAt
                          ? new Date(r.submittedAt).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Link
                          href={hrefForAttempt(
                            r.attemptId,
                            r.status,
                            r.category
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#303380] hover:underline"
                        >
                          {r.status === "SUBMITTED" ? "Results" : "Attempt"}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
          Opens in a new tab. Use Results for finished tests; Attempt for in progress.
        </div>
      </div>
    </div>
  );
}

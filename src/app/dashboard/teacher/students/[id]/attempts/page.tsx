"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Calendar, CheckCircle, Clock, Trash2 } from "lucide-react";

interface Attempt {
  id: string;
  status: string;
  createdAt: string;
  submittedAt: string | null;
  overallPercent: number | null;
  exam: {
    id: string;
    title: string;
    category: string;
  } | null;
  sections: {
    type: string;
    rawScore: number | null;
    maxScore: number | null;
  }[];
}

interface Student {
  id: string;
  name: string | null;
  email: string;
}

export default function StudentAttemptsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentRes, attemptsRes] = await Promise.all([
        fetch(`/api/teacher/students/${studentId}`),
        fetch(`/api/teacher/students/${studentId}/attempts`),
      ]);

      if (studentRes.ok) {
        const studentData = await studentRes.json();
        setStudent(studentData.student);
      }

      if (attemptsRes.ok) {
        const attemptsData = await attemptsRes.json();
        setAttempts(attemptsData.attempts || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Submitted
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      IELTS: "bg-blue-100 text-blue-800",
      TOEFL: "bg-purple-100 text-purple-800",
      SAT: "bg-orange-100 text-orange-800",
      GENERAL_ENGLISH: "bg-green-100 text-green-800",
      MATH: "bg-red-100 text-red-800",
      KIDS: "bg-pink-100 text-pink-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const handleDeleteAttempt = async (attemptId: string) => {
    const target = attempts.find((a) => a.id === attemptId);
    const label = target?.exam?.title || "this exam";
    if (
      !confirm(
        `Are you sure you want to delete the attempt for "${label}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(attemptId);
    try {
      const res = await fetch(`/api/teacher/attempts/${attemptId}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || "Failed to delete attempt");
      }
      setAttempts((prev) => prev.filter((a) => a.id !== attemptId));
    } catch (error: any) {
      console.error("Delete attempt error:", error);
      alert(error?.message || "Failed to delete attempt");
    } finally {
      setDeletingId(null);
    }
  };

  const totalAttempts = attempts.length;
  const submittedCount = attempts.filter((a) => a.status === "SUBMITTED").length;
  const inProgressCount = attempts.filter((a) => a.status === "IN_PROGRESS").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 space-y-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Class
        </button>

        {student && (
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 font-medium text-base">
                  {(student.name || student.email).charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-semibold text-gray-900">
                  {student.name || "Student"}
                </h1>
                <p className="text-gray-500 text-xs sm:text-sm">{student.email}</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-6 text-xs text-gray-600">
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {totalAttempts}
                </div>
                <div className="text-[11px] text-gray-500">Total attempts</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-emerald-700">
                  {submittedCount}
                </div>
                <div className="text-[11px] text-gray-500">Submitted</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-blue-700">
                  {inProgressCount}
                </div>
                <div className="text-[11px] text-gray-500">In progress</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Attempts List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-md p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-6 bg-gray-400 rounded w-1/3"></div>
                <div className="h-4 bg-gray-400 rounded w-1/2"></div>
                <div className="h-4 bg-gray-400 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : attempts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Attempts</h3>
          <p className="text-gray-600">This student hasn&apos;t attempted any exams yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt) => {
            const isSubmitted = attempt.status === "SUBMITTED";
            const statusLabel =
              attempt.status === "SUBMITTED"
                ? "Submitted"
                : attempt.status === "IN_PROGRESS"
                ? "In progress"
                : attempt.status;

            return (
              <div
                key={attempt.id}
                className="bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-between">
                  {/* Left: exam meta + section stats */}
                  <div className="flex-1 min-w-0 flex flex-col gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {attempt.exam && (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${getCategoryColor(
                              attempt.exam.category
                            )}`}
                          >
                            {attempt.exam.category}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                            isSubmitted
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : attempt.status === "IN_PROGRESS"
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : "bg-gray-50 text-gray-600 border border-gray-100"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                        {attempt.exam?.title || "Unknown Exam"}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(attempt.createdAt)}
                        </span>
                        {attempt.submittedAt && (
                          <span className="text-gray-400">
                            • Submitted {formatDate(attempt.submittedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Section inline stats */}
                    {attempt.sections && attempt.sections.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-600">
                        {attempt.sections.map((section, idx) => (
                          <div key={idx} className="flex items-baseline gap-1">
                            <span className="uppercase tracking-wide text-[10px] text-slate-500">
                              {section.type}
                            </span>
                            <span className="font-semibold tabular-nums text-slate-900">
                              {section.rawScore ?? "—"}/{section.maxScore ?? "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: score + actions */}
                  <div className="mt-3 sm:mt-0 sm:w-56 flex flex-col justify-between items-stretch gap-3 sm:pl-6 sm:border-l sm:border-slate-100">
                    {attempt.overallPercent !== null && (
                      <div className="flex items-start justify-between sm:flex-col sm:items-end sm:justify-start gap-1">
                        <span className="text-xs uppercase tracking-wide text-gray-400">
                          Overall score
                        </span>
                        <span
                          className={`text-2xl sm:text-3xl font-semibold tabular-nums ${
                            attempt.overallPercent >= 75
                              ? "text-emerald-600"
                              : attempt.overallPercent >= 50
                              ? "text-amber-600"
                              : "text-rose-600"
                          }`}
                        >
                          {attempt.overallPercent}%
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteAttempt(attempt.id)}
                        disabled={deletingId === attempt.id}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md px-2 py-1 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deletingId === attempt.id ? "Deleting..." : "Delete"}
                      </button>
                      <button
                        onClick={() => router.push(`/attempts/${attempt.id}/results`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white rounded-md transition-colors text-[11px] font-medium shadow-sm whitespace-nowrap"
                        style={{ backgroundColor: "#303380" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#252a6b";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#303380";
                        }}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


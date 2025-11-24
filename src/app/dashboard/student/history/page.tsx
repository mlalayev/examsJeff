"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, CheckCircle, FileText, BookOpen, Trash2, Loader2 } from "lucide-react";

interface AttemptItem {
  id: string;
  status: string;
  createdAt: string;
  submittedAt: string | null;
  overallPercent: number | null;
  exam: { id: string; title: string; category: string; track?: string | null } | null;
  class: { id: string; name: string; teacher?: { id: string; name?: string | null } } | null;
  sections: { type: string; rawScore: number | null; maxScore: number | null }[];
}

export default function StudentHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<AttemptItem[]>([]);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; attempt: AttemptItem | null }>({
    open: false,
    attempt: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/student/attempts");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load attempts");
        setAttempts(json.attempts || []);
      } catch (e) {
        console.error(e);
        alert(e instanceof Error ? e.message : "Failed to load attempts");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openDeleteModal = (attempt: AttemptItem) => {
    setDeleteModal({ open: true, attempt });
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteModal({ open: false, attempt: null });
  };

  const handleDelete = async () => {
    if (!deleteModal.attempt) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/student/attempts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: deleteModal.attempt.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete attempt");
      setAttempts((prev) => prev.filter((a) => a.id !== deleteModal.attempt?.id));
      closeDeleteModal();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to delete attempt");
    } finally {
      setIsDeleting(false);
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Minimal Header */}
      <div className="mb-8 sm:mb-12">
        <h1 className="text-xl sm:text-2xl font-medium text-gray-900">My Exam History</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">View all your past exam attempts and results</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-md p-4 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 bg-gray-400 rounded w-20 animate-pulse"></div>
                    <div className="h-6 bg-gray-400 rounded w-24 animate-pulse"></div>
                  </div>
                  <div className="h-6 bg-gray-400 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-400 rounded w-1/2 animate-pulse"></div>
                </div>
                <div className="text-right ml-4">
                  <div className="h-4 bg-gray-400 rounded w-20 mb-2 animate-pulse"></div>
                  <div className="h-8 bg-gray-400 rounded w-16 animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="h-4 bg-gray-400 rounded w-32 animate-pulse"></div>
                  <div className="h-4 bg-gray-400 rounded w-36 animate-pulse"></div>
                </div>
                <div className="h-9 bg-gray-400 rounded-md w-28 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      ) : attempts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Exam History</h3>
          <p className="text-gray-600 mb-6">You haven't taken any exams yet.</p>
          <Link
            href="/dashboard/student/exams"
            className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-md transition-colors text-sm font-medium"
            style={{ backgroundColor: "#303380" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#252a6b";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#303380";
            }}
          >
            <BookOpen className="w-4 h-4" />
            Browse Available Exams
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map((a) => (
            <div
              key={a.id}
              className="bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                      {a.exam && (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getCategoryColor(a.exam.category)}`}>
                          {a.exam.category}
                          {a.exam.track && ` · ${a.exam.track}`}
                        </span>
                      )}
                      {getStatusBadge(a.status)}
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                      {a.exam?.title || "Unknown Exam"}
                    </h3>
                    {a.class && (
                      <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                        {a.class.name && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {a.class.name}
                          </span>
                        )}
                        {a.class.teacher?.name && (
                          <span>Teacher: {a.class.teacher.name}</span>
                        )}
                      </div>
                    )}
                  </div>
                  {a.overallPercent !== null && (
                    <div className="text-right ml-4">
                      <div className="text-xs sm:text-sm text-gray-500 mb-1">Overall Score</div>
                      <div className={`text-2xl sm:text-3xl font-medium ${
                        a.overallPercent >= 75 ? "text-green-600" : 
                        a.overallPercent >= 50 ? "text-yellow-600" : 
                        "text-red-600"
                      }`}>
                        {a.overallPercent}%
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>Started: {formatDate(a.createdAt)}</span>
                    </div>
                    {a.submittedAt && (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        <span>Submitted: {formatDate(a.submittedAt)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openDeleteModal(a)}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                    <Link
                      href={`/attempts/${a.id}/results`}
                      className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-md transition-colors text-sm font-medium"
                      style={{ backgroundColor: "#303380" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#252a6b";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#303380";
                      }}
                    >
                      <FileText className="w-4 h-4" />
                      View Results
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteModal.open && deleteModal.attempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Exam Attempt</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to remove{" "}
              <span className="font-medium">{deleteModal.attempt.exam?.title || "this attempt"}</span>{" "}
              from your history? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
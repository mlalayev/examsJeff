"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Eye, Clock, User, CheckCircle2, XCircle } from "lucide-react";

interface WritingSubmissionListItem {
  id: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  class?: {
    id: string;
    name: string;
  };
  submittedAt: string;
  wordCountTask1: number;
  wordCountTask2: number;
  overallBand?: number | null;
  task1Band?: number | null;
  task2Band?: number | null;
  feedbackPublished: boolean;
  gradedAt?: string | null;
  gradedBy?: {
    id: string;
    name: string;
  } | null;
}

export default function WritingSubmissionsListPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<WritingSubmissionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "ungraded">("all");

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const url = `/api/writing-submissions${filter === "ungraded" ? "?onlyUngraded=true" : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions);
      } else {
        alert("Failed to load submissions");
      }
    } catch (error) {
      console.error("Failed to load submissions:", error);
      alert("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Writing Submissions</h1>
          <p className="text-gray-600">Review and grade IELTS Writing submissions</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Submissions
            </button>
            <button
              onClick={() => setFilter("ungraded")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "ungraded"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Needs Grading
            </button>
          </div>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-300 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
            <p className="text-gray-600">
              {filter === "ungraded"
                ? "All writing submissions have been graded!"
                : "No writing submissions yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/teacher/writing-review/${submission.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {submission.student.name}
                      </h3>
                      {submission.feedbackPublished ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                          <XCircle className="w-3 h-3" />
                          Draft
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span>
                          Task 1: {submission.wordCountTask1}w • Task 2: {submission.wordCountTask2}w
                        </span>
                      </div>

                      {submission.overallBand && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="font-medium">
                            Band: {submission.overallBand}
                          </span>
                        </div>
                      )}
                    </div>

                    {submission.class && (
                      <div className="mt-2 text-xs text-gray-500">
                        Class: {submission.class.name}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/teacher/writing-review/${submission.id}`);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ml-4"
                  >
                    <Eye className="w-4 h-4" />
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Eye, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";

interface AttemptItem {
  id: string;
  studentName: string;
  studentEmail: string;
  examTitle: string;
  status: string;
  submittedAt: string | null;
  totalScore: number | null;
  totalQuestions: number;
  correctAnswers: number;
}

export default function TeacherAttemptsPage() {
  const router = useRouter();
  const [attempts, setAttempts] = useState<AttemptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/attempts");
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to load attempts");
      }
      
      setAttempts(data.attempts || []);
    } catch (err) {
      console.error("Error fetching attempts:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAttempts = attempts.filter(
    (attempt) =>
      attempt.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attempt.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attempt.examTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      SUBMITTED: "bg-green-100 text-green-700",
      IN_PROGRESS: "bg-yellow-100 text-yellow-700",
      GRADED: "bg-blue-100 text-blue-700",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-2xl font-medium text-gray-900">Student Attempts</h1>
        <p className="text-gray-500 mt-1">Review all student exam attempts</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-8 mb-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Total Attempts:</span>
          <span className="font-medium">{attempts.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Submitted:</span>
          <span className="font-medium">
            {attempts.filter((a) => a.status === "SUBMITTED").length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">In Progress:</span>
          <span className="font-medium">
            {attempts.filter((a) => a.status === "IN_PROGRESS").length}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student name, email, or exam..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <button
          onClick={fetchAttempts}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <UnifiedLoading type="spinner" variant="dots" size="md" />
          </div>
        ) : filteredAttempts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No attempts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                    Student
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                    Exam
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                    Score
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                    Submitted
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAttempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <div className="font-medium text-gray-900">
                          {attempt.studentName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {attempt.studentEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {attempt.examTitle}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                          attempt.status
                        )}`}
                      >
                        {attempt.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {attempt.status === "SUBMITTED" && attempt.totalScore !== null ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {attempt.totalScore.toFixed(1)}%
                          </span>
                          <span className="text-xs text-gray-500">
                            ({attempt.correctAnswers}/{attempt.totalQuestions})
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {attempt.submittedAt
                        ? new Date(attempt.submittedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {attempt.status === "SUBMITTED" ? (
                        <button
                          onClick={() =>
                            router.push(`/attempts/${attempt.id}/results`)
                          }
                          className="flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium"
                          title="View detailed results"
                        >
                          <Eye className="w-4 h-4" />
                          Review
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">Not submitted</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


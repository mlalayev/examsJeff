"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FileText, User, Calendar, CheckCircle, Clock, ChevronRight } from "lucide-react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";

interface QueueItem {
  attemptId: string;
  student: {
    id: string;
    name: string | null;
    email: string;
  };
  exam: {
    id: string;
    title: string;
    examType: string;
  };
  submittedAt: string | null;
  bandOverall: number | null;
  sections: Array<{
    id: string;
    type: string;
    bandScore: number | null;
    gradedById: string | null;
    status: string;
  }>;
  pendingCount: number;
  gradedCount: number;
  totalSections: number;
}

export default function TeacherGradingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  useEffect(() => {
    if (session) {
      fetchQueue();
    }
  }, [session, filter]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/grading/queue?status=${filter}`);
      if (!response.ok) throw new Error("Failed to fetch queue");
      const data = await response.json();
      setQueue(data.queue);
    } catch (error) {
      console.error("Error fetching grading queue:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSectionBadgeColor = (status: string) => {
    return status === "graded" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800";
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Grading Queue</h1>
        <p className="text-gray-600">Grade Writing and Speaking sections for your students</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              filter === "pending"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              filter === "all"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <UnifiedLoading type="spinner" variant="spinner" size="lg" />
      ) : queue.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No submissions to grade</h3>
          <p className="text-gray-600">
            {filter === "pending"
              ? "All Writing and Speaking sections have been graded!"
              : "No submissions yet from your students."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((item) => (
            <div
              key={item.attemptId}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Student Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.student.name || item.student.email}
                      </h3>
                      <p className="text-sm text-gray-600">{item.exam.title}</p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Submitted:{" "}
                        {item.submittedAt
                          ? new Date(item.submittedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A"}
                      </span>
                    </div>
                    {item.bandOverall && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Overall Band: {item.bandOverall}</span>
                      </div>
                    )}
                  </div>

                  {/* Sections */}
                  <div className="flex flex-wrap gap-2">
                    {item.sections.map((section) => (
                      <div key={section.id} className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getSectionBadgeColor(
                            section.status
                          )}`}
                        >
                          {section.type}
                          {section.bandScore !== null && ` - ${section.bandScore}`}
                        </span>
                        {section.status === "pending" && (
                          <button
                            onClick={() =>
                              router.push(`/dashboard/teacher/grading/${section.id}`)
                            }
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1"
                          >
                            Grade
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Progress */}
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(item.gradedCount / item.totalSections) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 font-medium">
                      {item.gradedCount}/{item.totalSections}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="ml-4">
                  {item.pendingCount > 0 ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        {item.pendingCount} pending
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Complete</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


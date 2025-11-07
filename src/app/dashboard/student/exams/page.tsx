"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Search } from "lucide-react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";

type SectionType = "READING" | "LISTENING" | "WRITING" | "SPEAKING" | "GRAMMAR" | "VOCABULARY";

interface StudentExamItem {
  id: string;           // booking id
  examId: string;
  title: string;
  category: string;
  track?: string | null;
  sections: SectionType[];
  startAt?: string | null;
  dueAt?: string | null;
  createdAt: string;
  teacher?: string;
  status?: string;
  attemptId?: string;
}

export default function StudentExamsPage() {
  const router = useRouter();
  const [items, setItems] = useState<StudentExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/exams");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load exams");
      
      // Transform bookings to exam items
      const examItems = (data.bookings || []).map((booking: any) => ({
        id: booking.id,
        examId: booking.examId,
        title: booking.exam?.title || "Unknown Exam",
        category: booking.exam?.category || "UNKNOWN",
        track: booking.exam?.track,
        sections: booking.sections || [],
        startAt: booking.startAt,
        dueAt: booking.dueAt,
        createdAt: booking.createdAt,
        teacher: booking.teacher?.name || "Unknown Teacher",
        status: booking.attempt?.status || "NOT_STARTED",
        attemptId: booking.attempt?.id,
      }));
      
      setItems(examItems);
    } catch (err) {
      console.error("Failed to load student exams", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter((i) =>
    i.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleStart = async (bookingId: string) => {
    setStarting(bookingId);
    try {
      // Create or get attempt for this booking with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const res = await fetch("/api/student/attempt/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to start exam");
        setStarting(null);
        return;
      }

      // Navigate to attempt runner immediately using replace for better UX
      router.replace(`/attempts/${data.attemptId}/run`);
      // Don't set starting to null here - let the navigation handle it
    } catch (err) {
      console.error("Failed to start exam", err);
      if (err.name === 'AbortError') {
        alert("Request timed out. Please try again.");
      } else {
        alert("Failed to start exam");
      }
      setStarting(null);
    }
  };

  const stats = {
    total: items.length,
    notStarted: items.filter(i => i.status === "NOT_STARTED").length,
    inProgress: items.filter(i => i.status === "IN_PROGRESS").length,
    completed: items.filter(i => i.status === "COMPLETED").length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Minimal Header */}
      <div className="mb-8 sm:mb-12">
        <h1 className="text-xl sm:text-2xl font-medium text-gray-900">My Exams</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">Exams assigned by your teacher</p>
        {starting && (
          <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-md flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-slate-900">Preparing your exam...</span>
          </div>
        )}
      </div>

      {/* Compact Stats Row */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-8 mb-6 sm:mb-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Total:</span>
          <span className="font-medium">{stats.total}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Not Started:</span>
          <span className="font-medium">{stats.notStarted}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">In Progress:</span>
          <span className="font-medium">{stats.inProgress}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Completed:</span>
          <span className="font-medium">{stats.completed}</span>
        </div>
      </div>

      {/* Simple Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search exams..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
      </div>

      {/* Simple Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <UnifiedLoading type="spinner" variant="pulse" size="md" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No assigned exams yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Title</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Category</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Due Date</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{item.title}</div>
                          {item.track && (
                            <div className="text-xs text-gray-500">{item.track}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                      {item.category}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                      {item.dueAt ? new Date(item.dueAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : item.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {item.status === "COMPLETED" ? "Completed" : item.status === "IN_PROGRESS" ? "In Progress" : "Not Started"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm">
                      {starting === item.id ? (
                        <div className="px-3 py-1.5 text-sm rounded-md text-white bg-slate-900 flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="font-medium">Starting...</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStart(item.id)}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition"
                        >
                          Start Exam
                        </button>
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





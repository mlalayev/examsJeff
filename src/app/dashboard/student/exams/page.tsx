"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Calendar, Clock, Search, AlertCircle } from "lucide-react";
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Exams</h1>
        <p className="text-gray-500">Exams assigned by your teacher</p>
        {starting && (
          <div className="mt-3 p-3 border rounded-lg flex items-center gap-2"
               style={{ 
                 backgroundColor: 'rgba(48, 51, 128, 0.1)',
                 borderColor: 'rgba(48, 51, 128, 0.2)'
               }}>
            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                 style={{ borderColor: '#303380' }}></div>
            <span className="text-sm font-medium" style={{ color: '#303380' }}>Preparing your exam...</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
            placeholder="Search exams..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          onClick={fetchItems}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <UnifiedLoading type="skeleton" variant="list" count={3} className="p-6" />
        ) : filtered.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-500">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            No assigned exams yet
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((item) => (
              <li key={item.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{item.title}</h3>
                        {item.track && (
                          <span className="px-2 py-0.5 text-xs rounded bg-purple-50 text-purple-700 border border-purple-200">{item.track}</span>
                        )}
                        <span className="px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700 border border-blue-200">{item.category}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {item.startAt ? new Date(item.startAt).toLocaleString() : "Flexible start"}
                        </div>
                        {item.dueAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Due {new Date(item.dueAt).toLocaleString()}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-gray-500">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Sections: {item.sections.join(", ")}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {starting === item.id ? (
                      <div className="px-4 py-2 text-sm rounded-md text-white flex items-center gap-2 shadow-lg"
                           style={{ backgroundColor: '#303380' }}>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-medium">Starting Exam...</span>
                      </div>
                    ) : (
                      <button
                        className="px-4 py-2 text-sm rounded-md text-white transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                        style={{ backgroundColor: '#303380' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#252a6b';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#303380';
                        }}
                        onClick={() => handleStart(item.id)}
                      >
                        <span className="font-medium">Start Exam</span>
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}





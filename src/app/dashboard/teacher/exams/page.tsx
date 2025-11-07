"use client";

import { useEffect, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";

interface Exam {
  id: string;
  title: string;
  isActive: boolean;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  _count?: {
    bookings: number;
  };
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      // Fetch both DB and JSON exams
      const [dbRes, jsonRes] = await Promise.all([
        fetch("/api/exams"),
        fetch("/api/exams/json")
      ]);
      
      const dbData = dbRes.ok ? await dbRes.json() : { exams: [] };
      const jsonData = jsonRes.ok ? await jsonRes.json() : { exams: [] };
      
      // Merge and mark source
      const allExams = [
        ...dbData.exams.map((e: any) => ({ ...e, source: 'db' })),
        ...jsonData.exams.map((e: any) => ({ ...e, source: 'json', createdAt: new Date().toISOString() }))
      ];
      
      setExams(allExams);
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
    }
  };



  const filteredExams = exams.filter((exam) =>
    exam.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: exams.length,
    active: exams.filter(exam => exam.isActive).length,
    totalAssignments: exams.reduce((sum, exam) => sum + (exam._count?.bookings || 0), 0),
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Minimal Header */}
      <div className="mb-8 sm:mb-12">
        <h1 className="text-xl sm:text-2xl font-medium text-gray-900">Exams</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">View available exams</p>
      </div>

      {/* Compact Stats Row */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-8 mb-6 sm:mb-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Total Exams:</span>
          <span className="font-medium">{stats.total}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Active:</span>
          <span className="font-medium">{stats.active}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Total Assignments:</span>
          <span className="font-medium">{stats.totalAssignments}</span>
        </div>
      </div>

      {/* Simple Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search exams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
      ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Title</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Assignments</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{exam.title}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            {exam.id.slice(0, 8)}
                            {(exam as any).source === 'json' && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">JSON</span>
                            )}
                            {exam.track && <span>· {exam.track}</span>}
                          </div>
                  </div>
                </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  exam.isActive 
                    ? "bg-green-100 text-green-700" 
                    : "bg-gray-100 text-gray-700"
                }`}>
                  {exam.isActive ? "Active" : "Inactive"}
                </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                      {exam._count?.bookings || 0}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                      {new Date(exam.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredExams.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No exams found</p>
                </div>
              )}
            </div>
        )}
        </div>
    </div>
  );
}


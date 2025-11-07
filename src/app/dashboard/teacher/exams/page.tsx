"use client";

import { useEffect, useState } from "react";
import { Plus, BookOpen, Search, Edit, Calendar } from "lucide-react";

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [examTitle, setExamTitle] = useState("");
  const [creating, setCreating] = useState(false);

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


  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: examTitle,
          isActive: true 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create exam");
      }

      setExams([data.exam, ...exams]);
      setExamTitle("");
      setShowCreateModal(false);
    } catch (err) {
      console.error("Error creating exam:", err);
    } finally {
      setCreating(false);
    }
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setExamTitle("");
    document.body.style.overflow = 'unset';
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
    <div className="p-8">
      {/* Minimal Header */}
      <div className="mb-12">
        <h1 className="text-2xl font-medium text-gray-900">Exams</h1>
        <p className="text-gray-500 mt-1">Create exam templates to assign to students</p>
      </div>

      {/* Compact Stats Row */}
      <div className="flex items-center gap-8 mb-8 text-sm">
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
      <div className="flex items-center gap-4 mb-6">
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
        <button
          onClick={openCreateModal}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          <Plus className="w-4 h-4 mr-2 inline" />
          Create Exam
        </button>
      </div>

      {/* Simple Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
      {loading ? (
          <div className="flex items-center justify-center h-32">
            <UnifiedLoading type="spinner" variant="pulse" size="md" />
        </div>
      ) : (
          <div className="overflow-x-auto pb-6">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Title</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Assignments</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Created</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
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
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  exam.isActive 
                    ? "bg-green-100 text-green-700" 
                    : "bg-gray-100 text-gray-700"
                }`}>
                  {exam.isActive ? "Active" : "Inactive"}
                </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {exam._count?.bookings || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(exam.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button className="text-gray-400 hover:text-gray-600">
                        <Edit className="w-4 h-4" />
                      </button>
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

      {/* Create Exam Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeCreateModal();
            }
          }}
        >
          <div className="bg-white w-full max-w-md border border-gray-200 rounded-md shadow-lg">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Create Exam</h3>
              <p className="text-sm text-gray-500 mt-1">Create a new exam template</p>
              </div>
            
            {/* Modal Content */}
            <form onSubmit={handleCreateExam}>
              <div className="px-6 py-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Title
                </label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleCreateExam(e)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                  placeholder="e.g., IELTS Academic Mock Exam #1"
                    autoFocus
                    required
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Create exam templates that you can assign to students with specific dates and sections
                </p>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !examTitle.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


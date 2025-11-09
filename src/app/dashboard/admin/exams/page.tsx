"use client";

import { useEffect, useState } from "react";
import { BookOpen, Plus, Search, Edit, Upload, Trash2 } from "lucide-react";
import Link from "next/link";

interface Exam {
  id: string;
  title: string;
  category: string;
  track: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    sections: number;
    questions: number;
  };
}

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [togglingExamId, setTogglingExamId] = useState<string | null>(null);

  useEffect(() => {
    fetchExams();
  }, [filterCategory, filterActive]);

  const fetchExams = async () => {
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.append("category", filterCategory);
      if (filterActive !== null) params.append("isActive", filterActive.toString());
      
      const res = await fetch(`/api/admin/exams?${params}`);
      if (res.ok) {
        const data = await res.json();
        setExams(data.exams || []);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (examId: string, currentStatus: boolean) => {
    setTogglingExamId(examId);
    try {
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (res.ok) {
        await fetchExams();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update exam status");
      }
    } catch (error) {
      console.error("Error updating exam:", error);
      alert("Failed to update exam status");
    } finally {
      setTogglingExamId(null);
    }
  };

  const handleDelete = async (examId: string, examTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${examTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchExams();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete exam");
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      alert("Failed to delete exam");
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = 
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.track && exam.track.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const categories = ["IELTS", "TOEFL", "SAT", "GENERAL_ENGLISH", "MATH", "KIDS"];

  const stats = {
    total: exams.length,
    active: exams.filter(exam => exam.isActive).length,
    totalSections: exams.reduce((sum, exam) => sum + exam._count.sections, 0),
    totalQuestions: exams.reduce((sum, exam) => sum + exam._count.questions, 0),
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Minimal Header */}
      <div className="mb-8 sm:mb-12">
        <h1 className="text-xl sm:text-2xl font-medium text-gray-900">Exams</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage exam content and questions</p>
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
          <span className="text-gray-500">Total Sections:</span>
          <span className="font-medium">{stats.totalSections}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Total Questions:</span>
          <span className="font-medium">{stats.totalQuestions}</span>
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
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select
            value={filterCategory || ""}
            onChange={(e) => setFilterCategory(e.target.value || null)}
            className="flex-1 sm:flex-none px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 min-w-[140px]"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={filterActive === null ? "" : filterActive.toString()}
            onChange={(e) => setFilterActive(e.target.value === "" ? null : e.target.value === "true")}
            className="flex-1 sm:flex-none px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 min-w-[120px]"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <Link
            href="/dashboard/admin/exams/upload"
            className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 whitespace-nowrap"
          >
            <Upload className="w-4 h-4 sm:mr-2 inline" />
            <span className="hidden sm:inline">Upload</span>
          </Link>
          <Link
            href="/dashboard/admin/exams/create"
            className="px-3 sm:px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 sm:mr-2 inline" />
            <span className="hidden sm:inline">Create Exam</span>
          </Link>
        </div>
      </div>

      {/* Simple Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Title</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Category</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Sections</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Questions</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-400 rounded-md animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-400 rounded w-32 animate-pulse"></div>
                          <div className="h-3 bg-gray-400 rounded w-16 animate-pulse"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="h-4 bg-gray-400 rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="h-4 bg-gray-400 rounded w-8 animate-pulse"></div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="h-4 bg-gray-400 rounded w-8 animate-pulse"></div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="h-6 bg-gray-400 rounded-full w-16 animate-pulse"></div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <div className="h-6 bg-gray-400 rounded w-20 animate-pulse"></div>
                        <div className="h-6 bg-gray-400 rounded w-16 animate-pulse"></div>
                        <div className="h-6 bg-gray-400 rounded w-16 animate-pulse"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Title</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Category</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Sections</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Questions</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
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
                          {exam.track && (
                            <div className="text-xs text-gray-500">{exam.track}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                      {exam.category}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                      {exam._count.sections}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                      {exam._count.questions}
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
                    <td className="px-3 sm:px-4 py-3 text-sm">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <button
                          onClick={() => handleToggleActive(exam.id, exam.isActive)}
                          disabled={togglingExamId === exam.id}
                          className={`px-2 py-1 text-xs font-medium rounded transition ${
                            exam.isActive
                              ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {togglingExamId === exam.id ? "Updating..." : exam.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <Link
                          href={`/dashboard/admin/exams/${exam.id}`}
                          className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(exam.id, exam.title)}
                          className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
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

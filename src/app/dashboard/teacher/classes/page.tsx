"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, Search, Edit, BarChart3 } from "lucide-react";

interface Class {
  id: string;
  name: string;
  createdAt: string;
  _count: {
    classStudents: number;
  };
}

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes");
      if (!response.ok) throw new Error("Failed to fetch classes");
      const data = await response.json();
      setClasses(data.classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClassName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create class");
      }

      setClasses([data.class, ...classes]);
      setNewClassName("");
      setShowCreateModal(false);
    } catch (err) {
      console.error("Error creating class:", err);
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
    setNewClassName("");
    document.body.style.overflow = 'unset';
  };

  const filteredClasses = classes.filter((classItem) =>
    classItem.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: classes.length,
    totalStudents: classes.reduce((sum, classItem) => sum + classItem._count.classStudents, 0),
    averageStudents: classes.length > 0 ? Math.round(classes.reduce((sum, classItem) => sum + classItem._count.classStudents, 0) / classes.length) : 0,
  };

  return (
    <div className="p-8">
      {/* Minimal Header */}
      <div className="mb-12">
        <h1 className="text-2xl font-medium text-gray-900">Classes</h1>
        <p className="text-gray-500 mt-1">Manage your classes and students</p>
      </div>

      {/* Compact Stats Row */}
      <div className="flex items-center gap-8 mb-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Total Classes:</span>
          <span className="font-medium">{stats.total}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Total Students:</span>
          <span className="font-medium">{stats.totalStudents}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Average per Class:</span>
          <span className="font-medium">{stats.averageStudents}</span>
        </div>
      </div>

      {/* Simple Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search classes..."
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
          Create Class
        </button>
      </div>

      {/* Simple Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
          </div>
        ) : (
          <div className="overflow-x-auto pb-6">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Students</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Created</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClasses.map((classItem) => (
                  <tr key={classItem.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                          <Users className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{classItem.name}</div>
                          <div className="text-xs text-gray-500">{classItem.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{classItem._count.classStudents}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(classItem.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/teacher/classes/${classItem.id}`)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Manage"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/teacher/analytics/${classItem.id}`)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Analytics"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredClasses.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No classes found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Class Modal */}
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
              <h3 className="text-lg font-medium text-gray-900">Create Class</h3>
              <p className="text-sm text-gray-500 mt-1">Add a new class to manage students</p>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleCreateClass}>
              <div className="px-6 py-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Name
                  </label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleCreateClass(e)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                    placeholder="e.g., IELTS Advanced 2025"
                    autoFocus
                    required
                  />
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
                  disabled={creating || !newClassName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


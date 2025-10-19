"use client";

import { useEffect, useState } from "react";
import { Building2, Users, UserCheck, Plus, Edit, Search } from "lucide-react";
import Loading from "@/components/loading/Loading";

export default function BossBranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/boss/branches");
      const data = await res.json();
      setBranches(data.branches || []);
    } catch (error) {
      console.error("Failed to load branches:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter branches based on search
  const getFilteredBranches = () => {
    if (!searchQuery) return branches;
    return branches.filter(branch => 
      branch.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Get branch statistics
  const getBranchStats = () => {
    const stats = {
      total: branches.length,
      totalStudents: branches.reduce((sum, branch) => sum + (branch._count?.students || 0), 0),
      totalTeachers: branches.reduce((sum, branch) => sum + (branch._count?.teachers || 0), 0),
      totalUsers: branches.reduce((sum, branch) => sum + (branch._count?.users || 0), 0),
    };
    return stats;
  };

  const createBranch = async () => {
    if (!newBranchName.trim()) {
      alert("Branch name is required");
      return;
    }

    try {
      const res = await fetch("/api/boss/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBranchName.trim() }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewBranchName("");
        // Restore body scroll when modal is closed
        document.body.style.overflow = 'unset';
        await loadBranches();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create branch");
      }
    } catch (error) {
      console.error("Failed to create branch:", error);
      alert("Failed to create branch");
    }
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewBranchName("");
    // Restore body scroll when modal is closed
    document.body.style.overflow = 'unset';
  };

  const stats = getBranchStats();
  const filteredBranches = getFilteredBranches();

    return (
    <div className="p-8">
      {/* Minimal Header */}
      <div className="mb-12">
        <h1 className="text-2xl font-medium text-gray-900">Branches</h1>
        <p className="text-gray-500 mt-1">Manage your organization branches</p>
      </div>

      {/* Compact Stats Row */}
      <div className="flex items-center gap-8 mb-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Total:</span>
          <span className="font-medium">{stats.total}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Students:</span>
          <span className="font-medium">{stats.totalStudents}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Teachers:</span>
          <span className="font-medium">{stats.totalTeachers}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Total Users:</span>
          <span className="font-medium">{stats.totalUsers}</span>
        </div>
      </div>

      {/* Simple Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search branches..."
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
          Create Branch
        </button>
      </div>

      {/* Simple Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loading size="md" variant="dots" />
        </div>
      ) : (
          <div className="overflow-x-auto pb-6">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Students</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Teachers</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Total Users</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Created</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBranches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{branch.name}</div>
                          <div className="text-xs text-gray-500">{branch.id.slice(0, 8)}</div>
                </div>
              </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{branch._count?.students || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{branch._count?.teachers || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{branch._count?.users || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(branch.createdAt).toLocaleDateString()}
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
            {filteredBranches.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No branches found</p>
                </div>
            )}
        </div>
      )}
      </div>

      {/* Create Branch Modal */}
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
              <h3 className="text-lg font-medium text-gray-900">Create Branch</h3>
              <p className="text-sm text-gray-500 mt-1">Add a new branch to your organization</p>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch Name
              </label>
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && createBranch()}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                placeholder="e.g., Baku Center, Ganja Branch"
                autoFocus
              />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeCreateModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={createBranch}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Create Branch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
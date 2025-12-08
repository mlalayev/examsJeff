"use client";

import { useEffect, useState } from "react";
import { Building2, Search, Plus, Edit } from "lucide-react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";

export default function CreatorBranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any | null>(null);
  const [newBranchName, setNewBranchName] = useState("");
  const [editBranchName, setEditBranchName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

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
    document.body.style.overflow = 'hidden';
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewBranchName("");
    document.body.style.overflow = 'unset';
  };

  const openEditModal = (branch: any) => {
    setSelectedBranch(branch);
    setEditBranchName(branch.name);
    setShowEditModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedBranch(null);
    setEditBranchName("");
    document.body.style.overflow = 'unset';
  };

  const updateBranch = async () => {
    if (!selectedBranch || !editBranchName.trim()) {
      alert("Branch name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/boss/branches/${selectedBranch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editBranchName.trim() }),
      });

      if (res.ok) {
        closeEditModal();
        await loadBranches();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update branch");
      }
    } catch (error) {
      console.error("Failed to update branch:", error);
      alert("Failed to update branch");
    } finally {
      setSaving(false);
    }
  };

  const stats = getBranchStats();
  const filteredBranches = getFilteredBranches();

    return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Minimal Header */}
      <div className="mb-8 sm:mb-12">
        <h1 className="text-xl sm:text-2xl font-medium text-gray-900">Branches</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage organization branches</p>
      </div>

      {/* Compact Stats Row */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-8 mb-6 sm:mb-8 text-sm">
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
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
          className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
          style={{ backgroundColor: "#303380" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#252a6b";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#303380";
          }}
        >
          <Plus className="w-4 h-4 mr-2 inline" />
          Create Branch
        </button>
      </div>

      {/* Simple Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <UnifiedLoading type="spinner" variant="dots" size="md" />
        </div>
      ) : (
          <div className="overflow-x-auto pb-6">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Name</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Students</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Teachers</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Total Users</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Created</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBranches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3 text-sm">
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
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">{branch._count?.students || 0}</td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">{branch._count?.teachers || 0}</td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">{branch._count?.users || 0}</td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                    {new Date(branch.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm">
                      <button 
                        onClick={() => openEditModal(branch)}
                        className="text-gray-400 hover:text-gray-600"
                      >
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
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Create Branch</h3>
              <p className="text-sm text-gray-500 mt-1">Add a new branch to your organization</p>
            </div>

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

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeCreateModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createBranch}
                className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md"
          style={{ backgroundColor: "#303380" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#252a6b";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#303380";
          }}
              >
                Create Branch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {showEditModal && selectedBranch && (
        <div 
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeEditModal();
            }
          }}
        >
          <div className="bg-white w-full max-w-md border border-gray-200 rounded-md shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Edit Branch</h3>
              <p className="text-sm text-gray-500 mt-1">Update branch information</p>
            </div>

            <div className="px-6 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Name
                </label>
                <input
                  type="text"
                  value={editBranchName}
                  onChange={(e) => setEditBranchName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && updateBranch()}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                  placeholder="e.g., Baku Center, Ganja Branch"
                  autoFocus
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeEditModal}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={updateBranch}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md disabled:opacity-50"
                style={{ backgroundColor: "#303380" }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = "#252a6b";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = "#303380";
                  }
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

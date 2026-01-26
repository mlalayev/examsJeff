"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Building2, 
  GraduationCap, 
  Shield, 
  Crown,
  Filter,
  Search,
  MoreVertical,
  Edit,
  Trash2
} from "lucide-react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";

type UserRole = "STUDENT" | "TEACHER" | "ADMIN" | "BRANCH_ADMIN" | "BRANCH_BOSS";
type ViewMode = "all" | "branch" | "role";
type FilterType = "all" | UserRole;

export default function BossUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchMap, setBranchMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [approvedDesired, setApprovedDesired] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  
  // New state for filtering and view modes
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const load = async () => {
    setLoading(true);
    const [uRes, bRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/admin/branches"),
    ]);
    const u = await uRes.json();
    const b = await bRes.json();
    setUsers(u.users || []);
    setBranches(b.branches || []);
    setBranchMap(Object.fromEntries((b.branches || []).map((x: any) => [x.id, x.name])));
    setLoading(false);
  };

  // Filter users based on current filters
  const getFilteredUsers = () => {
    let filtered = users;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Branch filter
    if (selectedBranch !== "all") {
      filtered = filtered.filter(user => user.branchId === selectedBranch);
    }

    return filtered;
  };

  // Get user statistics
  const getUserStats = () => {
    const stats = {
      total: users.length,
      students: users.filter(u => u.role === "STUDENT").length,
      teachers: users.filter(u => u.role === "TEACHER").length,
      admins: users.filter(u => u.role === "ADMIN").length,
      branchAdmins: users.filter(u => u.role === "BRANCH_ADMIN" || u.role === "BRANCH_BOSS").length,
      approved: users.filter(u => u.approved).length,
      pending: users.filter(u => !u.approved).length,
    };
    return stats;
  };

  // Get role icon and color
  const getRoleInfo = (role: string) => {
    switch (role) {
      case "STUDENT":
        return { icon: GraduationCap, color: "from-blue-500 to-blue-600", bgColor: "bg-blue-50", textColor: "text-blue-700" };
      case "TEACHER":
        return { icon: UserCheck, color: "from-emerald-500 to-emerald-600", bgColor: "bg-emerald-50", textColor: "text-emerald-700" };
      case "ADMIN":
        return { icon: Shield, color: "from-purple-500 to-purple-600", bgColor: "bg-purple-50", textColor: "text-purple-700" };
      case "BRANCH_ADMIN":
        return { icon: Crown, color: "from-orange-500 to-orange-600", bgColor: "bg-orange-50", textColor: "text-orange-700" };
      case "BRANCH_BOSS":
        return { icon: Crown, color: "from-red-500 to-red-600", bgColor: "bg-red-50", textColor: "text-red-700" };
      default:
        return { icon: Users, color: "from-gray-500 to-gray-600", bgColor: "bg-gray-50", textColor: "text-gray-700" };
    }
  };

  useEffect(() => {
    load();
  }, []);

  const makeBranchAdmin = async (userId: string, branchId: string) => {
    if (!branchId) return;
    await fetch(`/api/admin/users/${userId}/assign-branch-admin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchId }),
    });
    load();
  };

  const openUserModal = (user: any) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setSelectedBranchId(user.branchId || "");
    setApprovedDesired(!!user.approved);
    setModalOpen(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  };

  const saveUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      // Single unified call to update approval, role, and branch
      const res = await fetch(`/api/admin/users/${selectedUser.id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          approved: approvedDesired,
          role: selectedRole,
          branchId: selectedBranchId || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to update user");
        setSaving(false);
        return;
      }

      setModalOpen(false);
      setSelectedUser(null);
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'unset';
      await load();
      
      // Show success message and remind to refresh
      alert("User updated successfully! If the user was approved, they should logout and login again to access their dashboard.");
    } catch (error) {
      console.error("Failed to save user:", error);
      alert("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const stats = getUserStats();
  const filteredUsers = getFilteredUsers();

  return (
    <div className="p-8">
      {/* Minimal Header */}
      <div className="mb-12">
        <h1 className="text-2xl font-medium text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">Manage your team members</p>
      </div>

      {/* Compact Stats Row */}
      <div className="flex items-center gap-8 mb-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Total:</span>
          <span className="font-medium">{stats.total}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Students:</span>
          <span className="font-medium">{stats.students}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Teachers:</span>
          <span className="font-medium">{stats.teachers}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Admins:</span>
          <span className="font-medium">{stats.admins}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Branch Admins:</span>
          <span className="font-medium">{stats.branchAdmins}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Pending:</span>
          <span className="font-medium text-orange-600">{stats.pending}</span>
        </div>
      </div>

      {/* Simple Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as FilterType)}
          className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
        >
          <option value="all">All Roles</option>
          <option value="STUDENT">Students</option>
          <option value="TEACHER">Teachers</option>
          <option value="BRANCH_ADMIN">Branch Admins</option>
          <option value="BRANCH_BOSS">Branch Boss</option>
          <option value="ADMIN">Admins</option>
        </select>
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
        >
          <option value="all">All Branches</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>
      </div>

      {/* Simple Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
      {loading ? (
          <UnifiedLoading type="skeleton" variant="table" count={1} />
        ) : (
          <div className="overflow-x-auto pb-6">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Role</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Branch</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700"></th>
              </tr>
            </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{user.name || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {branchMap[user.branchId] || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.approved ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                      }`}>
                        {user.approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => openUserModal(user)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No users found</p>
              </div>
            )}
        </div>
      )}
      </div>
      {modalOpen && selectedUser && (
        <div 
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModalOpen(false);
              setSelectedUser(null);
              document.body.style.overflow = 'unset';
            }
          }}
        >
          <div className="bg-white w-full max-w-md border border-gray-200 rounded-md shadow-lg">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
              <p className="text-sm text-gray-500 mt-1">Update user information</p>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 space-y-4">
              {/* User Info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium">{selectedUser.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium">{selectedUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Branch:</span>
                  <span className="font-medium">{branchMap[selectedUser.branchId] || "—"}</span>
                </div>
            </div>

              {/* Form Fields */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400" 
                    value={selectedRole} 
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="ADMIN">Admin</option>
                    <option value="BRANCH_ADMIN">Branch Admin</option>
                    <option value="BRANCH_BOSS">Branch Boss</option>
                </select>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400" 
                    value={selectedBranchId} 
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                  >
                    <option value="">Select branch</option>
                  {branches.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                  <p className="text-xs text-gray-500 mt-1">Required for Branch Admin role</p>
                </div>

                <div className="flex items-center gap-3">
                  <input 
                    id="approve" 
                    type="checkbox" 
                    className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500" 
                    checked={approvedDesired} 
                    onChange={(e) => setApprovedDesired(e.target.checked)} 
                  />
                  <label htmlFor="approve" className="text-sm font-medium text-gray-700">Approved</label>
              </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500" 
                onClick={() => { 
                  setModalOpen(false); 
                  setSelectedUser(null); 
                  // Restore body scroll when modal is closed
                  document.body.style.overflow = 'unset';
                }}
              >
                Cancel
              </button>
              <button 
                disabled={saving} 
                className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                onClick={saveUser}
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



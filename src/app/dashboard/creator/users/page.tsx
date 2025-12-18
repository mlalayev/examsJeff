"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Users, Key, Search, Filter, CheckCircle, XCircle, Plus,
  Eye, X, Check, Edit, Info
} from "lucide-react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";

export default function CreatorUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [searchUsers, setSearchUsers] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState(false);
  const [editingBranch, setEditingBranch] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [newBranchId, setNewBranchId] = useState("");
  const [branches, setBranches] = useState<any[]>([]);
  const [updating, setUpdating] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [tempRole, setTempRole] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/login");
      return;
    }

    const role = (session.user as any)?.role;
    if (role !== "CREATOR") {
      router.push("/dashboard/student");
      return;
    }

    fetchUsers();
    
    // Fetch branches for editing
    fetch("/api/branches")
      .then((res) => res.json())
      .then((data) => setBranches(data.branches || []))
      .catch(console.error);
  }, [session, status, router, searchUsers, roleFilter]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchUsers) params.append("search", searchUsers);
      if (roleFilter) params.append("role", roleFilter);

      const res = await fetch(`/api/creator/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;

    setResetting(true);
    try {
      const res = await fetch(`/api/creator/users/${selectedUser.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (res.ok) {
        alert(`Password reset successfully: ${selectedUser.email}\nNew password: ${newPassword}`);
        setSelectedUser(null);
        setNewPassword("");
        fetchUsers(); // Refresh list
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("Failed to reset password");
    }
    setResetting(false);
  };

  const handleApprove = async (userId: string, approved: boolean) => {
    setApproving(userId);
    try {
      const res = await fetch(`/api/creator/users/${userId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });

      if (res.ok) {
        fetchUsers(); // Refresh list
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("Failed to update approval status");
    }
    setApproving(null);
  };

  const fetchUserDetails = async (userId: string) => {
    setLoadingDetails(true);
    setShowDetailsModal(true);
    setEditingRole(false);
    setEditingBranch(false);
    try {
      const res = await fetch(`/api/creator/users/${userId}`);
      const data = await res.json();
      if (res.ok) {
        setUserDetails(data.user);
        setNewRole(data.user.role);
        setNewBranchId(data.user.branchId || "");
      } else {
        alert(`Error: ${data.error}`);
        setShowDetailsModal(false);
      }
    } catch (error) {
      alert("Failed to fetch user details");
      setShowDetailsModal(false);
    }
    setLoadingDetails(false);
  };

  const handleUpdateUser = async () => {
    if (!userDetails) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/creator/users/${userDetails.id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approved: userDetails.approved,
          role: newRole !== userDetails.role ? newRole : undefined,
          branchId: newBranchId !== userDetails.branchId ? (newBranchId || null) : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUserDetails({ ...userDetails, ...data.user });
        setEditingRole(false);
        setEditingBranch(false);
        fetchUsers(); // Refresh list
        alert("User updated successfully");
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("Failed to update user");
    }
    setUpdating(false);
  };

  const handleQuickRoleChange = async (userId: string, currentRole: string, approved: boolean) => {
    setEditingUserId(userId);
    setTempRole(currentRole);
  };

  const handleSaveQuickRole = async (userId: string, approved: boolean) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/creator/users/${userId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approved,
          role: tempRole,
        }),
      });

      if (res.ok) {
        setEditingUserId(null);
        fetchUsers(); // Refresh list
        alert("Role updated successfully");
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("Failed to update role");
    }
    setUpdating(false);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const role = (session?.user as any)?.role;
  if (role !== "CREATOR") {
    return null;
  }

  const roleColors: any = {
    STUDENT: "bg-blue-100 text-blue-700",
    TEACHER: "bg-green-100 text-green-700",
    ADMIN: "bg-purple-100 text-purple-700",
    BOSS: "bg-red-100 text-red-700",
    BRANCH_ADMIN: "bg-orange-100 text-orange-700",
    BRANCH_BOSS: "bg-pink-100 text-pink-700",
    CREATOR: "bg-gray-100 text-gray-700"
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Minimal Header */}
      <div className="mb-8 sm:mb-12">
        <h1 className="text-xl sm:text-2xl font-medium text-gray-900">
          Users
        </h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          Manage all system users
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div></div>
        <button
          onClick={() => router.push("/dashboard/creator/create-user")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md transition"
          style={{ backgroundColor: "#303380" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#252a6b";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#303380";
          }}
        >
          <Plus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* Simple Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchUsers}
            onChange={(e) => setSearchUsers(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <div className="relative sm:w-48">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="TEACHER">Teachers</option>
            <option value="PARENT">Parents</option>
            <option value="ADMIN">Admins</option>
            <option value="BOSS">Boss</option>
            <option value="BRANCH_ADMIN">Branch Admins</option>
            <option value="CREATOR">Creators</option>
          </select>
        </div>
      </div>

      {/* Simple Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">
                  User
                </th>
                <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">
                  Email
                </th>
                <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">
                  Role
                </th>
                <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">
                  Branch
                </th>
                <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">
                  Status
                </th>
                <th className="text-center px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usersLoading ? (
                // Skeleton loader rows - matching student exams style
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-400 rounded-md animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-400 rounded w-32 animate-pulse"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="h-4 bg-gray-400 rounded w-40 animate-pulse"></div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="h-6 bg-gray-400 rounded-full w-20 animate-pulse"></div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="h-4 bg-gray-400 rounded w-24 animate-pulse"></div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="h-6 bg-gray-400 rounded-full w-20 animate-pulse"></div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-8 h-8 bg-gray-400 rounded-md animate-pulse"></div>
                        <div className="w-8 h-8 bg-gray-400 rounded-md animate-pulse"></div>
                        <div className="w-8 h-8 bg-gray-400 rounded-md animate-pulse"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 sm:px-4 py-12 text-center text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm">
                      {editingUserId === user.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={tempRole}
                            onChange={(e) => setTempRole(e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-gray-400"
                            autoFocus
                          >
                            <option value="STUDENT">STUDENT</option>
                            <option value="TEACHER">TEACHER</option>
                            <option value="PARENT">PARENT</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="BOSS">BOSS</option>
                            <option value="BRANCH_ADMIN">BRANCH_ADMIN</option>
                            <option value="BRANCH_BOSS">BRANCH_BOSS</option>
                            <option value="CREATOR">CREATOR</option>
                          </select>
                          <button
                            onClick={() => handleSaveQuickRole(user.id, user.approved)}
                            disabled={updating}
                            className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingUserId(null);
                              setTempRole("");
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[user.role]}`}>
                            {user.role}
                          </span>
                          <button
                            onClick={() => handleQuickRoleChange(user.id, user.role, user.approved)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Change role"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                      {user.branch?.name || "—"}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm">
                      {user.approved ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">Approved</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-500">
                          <XCircle className="w-4 h-4" />
                          <span className="text-xs">Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => fetchUserDetails(user.id)}
                          className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-gray-700 transition-colors"
                          title="View all details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {user.approved ? (
                          <button
                            onClick={() => handleApprove(user.id, false)}
                            disabled={approving === user.id}
                            className="inline-flex items-center justify-center p-1.5 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Disapprove user"
                          >
                            {approving === user.id ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApprove(user.id, true)}
                            disabled={approving === user.id}
                            className="inline-flex items-center justify-center p-1.5 text-green-600 hover:text-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Approve user"
                          >
                            {approving === user.id ? (
                              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-gray-700 transition-colors"
                          title="Reset password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Password Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reset Password
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                User: <span className="font-medium">{selectedUser.name}</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Email: <span className="font-medium">{selectedUser.email}</span>
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setNewPassword("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={!newPassword || newPassword.length < 6 || resetting}
                className="px-4 py-2 text-sm font-medium text-white rounded-md transition disabled:opacity-50"
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
                {resetting ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            {loadingDetails ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading user details...</p>
              </div>
            ) : userDetails ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{userDetails.name}</h3>
                    <p className="text-gray-600">{userDetails.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setUserDetails(null);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 border-b pb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-mono text-gray-900">{userDetails.id}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Role:</span>
                        {editingRole ? (
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-gray-400"
                          >
                            <option value="STUDENT">STUDENT</option>
                            <option value="TEACHER">TEACHER</option>
                            <option value="PARENT">PARENT</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="BOSS">BOSS</option>
                            <option value="BRANCH_ADMIN">BRANCH_ADMIN</option>
                            <option value="BRANCH_BOSS">BRANCH_BOSS</option>
                            <option value="CREATOR">CREATOR</option>
                          </select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[userDetails.role]}`}>
                              {userDetails.role}
                            </span>
                            <button
                              onClick={() => setEditingRole(true)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Edit role"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status:</span>
                        <span className={userDetails.approved ? "text-green-600" : "text-gray-500"}>
                          {userDetails.approved ? "Approved" : "Pending"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Branch:</span>
                        {editingBranch ? (
                          <select
                            value={newBranchId}
                            onChange={(e) => setNewBranchId(e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-gray-400"
                          >
                            <option value="">No Branch</option>
                            {branches.map((branch) => (
                              <option key={branch.id} value={branch.id}>
                                {branch.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900">{userDetails.branch?.name || "—"}</span>
                            <button
                              onClick={() => setEditingBranch(true)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Edit branch"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="text-gray-900">{new Date(userDetails.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="text-gray-900">{new Date(userDetails.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 border-b pb-2">Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Classes Enrolled:</span>
                        <span className="font-medium">{userDetails._count?.classEnrollments || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bookings:</span>
                        <span className="font-medium">{userDetails._count?.bookingsAsStudent || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Attempts:</span>
                        <span className="font-medium">{userDetails._count?.attempts || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Enrollments:</span>
                        <span className="font-medium">{userDetails._count?.enrollments || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payments:</span>
                        <span className="font-medium">{userDetails._count?.payments || 0}</span>
                      </div>
                      {userDetails.role === "TEACHER" && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Classes Teaching:</span>
                            <span className="font-medium">{userDetails._count?.classesTeaching || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Exams Created:</span>
                            <span className="font-medium">{userDetails._count?.examsCreated || 0}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Student Profile */}
                  {userDetails.studentProfile && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 border-b pb-2">Student Profile</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">First Enrolled:</span>
                          <span className="text-gray-900">
                            {userDetails.studentProfile.firstEnrollAt 
                              ? new Date(userDetails.studentProfile.firstEnrollAt).toLocaleDateString()
                              : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Monthly Fee:</span>
                          <span className="text-gray-900">
                            {userDetails.studentProfile.monthlyFee 
                              ? `$${userDetails.studentProfile.monthlyFee}` 
                              : "—"}
                          </span>
                        </div>
                        {userDetails.studentProfile.teacher && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Teacher:</span>
                            <span className="text-gray-900">{userDetails.studentProfile.teacher.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Enrollments */}
                  {userDetails.enrollments && userDetails.enrollments.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 border-b pb-2">Enrollments</h4>
                      <div className="space-y-2 text-sm">
                        {userDetails.enrollments.map((enrollment: any) => (
                          <div key={enrollment.id} className="p-2 bg-gray-50 rounded">
                            <div className="font-medium">{enrollment.courseName}</div>
                            <div className="text-xs text-gray-600">
                              {enrollment.courseType} {enrollment.level && `- ${enrollment.level}`} - {enrollment.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Classes */}
                  {userDetails.classEnrollments && userDetails.classEnrollments.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 border-b pb-2">Classes</h4>
                      <div className="space-y-2 text-sm">
                        {userDetails.classEnrollments.map((enrollment: any) => (
                          <div key={enrollment.id} className="p-2 bg-gray-50 rounded">
                            <div className="font-medium">{enrollment.class.name}</div>
                            <div className="text-xs text-gray-600">
                              Enrolled: {new Date(enrollment.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Teacher Classes */}
                  {userDetails.classesTeaching && userDetails.classesTeaching.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 border-b pb-2">Teaching Classes</h4>
                      <div className="space-y-2 text-sm">
                        {userDetails.classesTeaching.map((classItem: any) => (
                          <div key={classItem.id} className="p-2 bg-gray-50 rounded">
                            <div className="font-medium">{classItem.name}</div>
                            <div className="text-xs text-gray-600">
                              {classItem._count.classStudents} students
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Attempts */}
                  {userDetails.attempts && userDetails.attempts.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 border-b pb-2">Recent Attempts</h4>
                      <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                        {userDetails.attempts.map((attempt: any) => (
                          <div key={attempt.id} className="p-2 bg-gray-50 rounded">
                            <div className="font-medium">{attempt.exam.title}</div>
                            <div className="text-xs text-gray-600">
                              {attempt.status} {attempt.bandOverall && `- Band: ${attempt.bandOverall}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              {attempt.submittedAt 
                                ? `Submitted: ${new Date(attempt.submittedAt).toLocaleDateString()}`
                                : attempt.startedAt 
                                ? `Started: ${new Date(attempt.startedAt).toLocaleDateString()}`
                                : `Created: ${new Date(attempt.createdAt).toLocaleDateString()}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Payments */}
                  {userDetails.payments && userDetails.payments.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 border-b pb-2">Recent Payments</h4>
                      <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                        {userDetails.payments.map((payment: any) => (
                          <div key={payment.id} className="p-2 bg-gray-50 rounded">
                            <div className="flex justify-between">
                              <span className="font-medium">${payment.amount}</span>
                              <span className={`text-xs ${payment.status === "PAID" ? "text-green-600" : "text-red-600"}`}>
                                {payment.status}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              Due: {new Date(payment.dueDate).toLocaleDateString()}
                              {payment.paidDate && ` | Paid: ${new Date(payment.paidDate).toLocaleDateString()}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tuition Payments */}
                  {userDetails.tuitionPayments && userDetails.tuitionPayments.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 border-b pb-2">Tuition Payments</h4>
                      <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                        {userDetails.tuitionPayments.map((payment: any) => (
                          <div key={payment.id} className="p-2 bg-gray-50 rounded">
                            <div className="flex justify-between">
                              <span className="font-medium">
                                {new Date(payment.year, payment.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </span>
                              <span className={`text-xs ${payment.status === "PAID" ? "text-green-600" : "text-red-600"}`}>
                                {payment.status} - ${payment.amount}
                              </span>
                            </div>
                            {payment.paidAt && (
                              <div className="text-xs text-gray-600">
                                Paid: {new Date(payment.paidAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 pt-6 border-t flex flex-wrap gap-3">
                  {(editingRole || editingBranch) && (
                    <>
                      <button
                        onClick={handleUpdateUser}
                        disabled={updating}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                        {updating ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingRole(false);
                          setEditingBranch(false);
                          setNewRole(userDetails.role);
                          setNewBranchId(userDetails.branchId || "");
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {!editingRole && !editingBranch && (
                    <>
                      <button
                        onClick={() => handleApprove(userDetails.id, !userDetails.approved)}
                        disabled={approving === userDetails.id}
                        className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed ${
                          userDetails.approved
                            ? "border border-red-200 text-red-600 hover:bg-red-50"
                            : "border border-green-200 text-green-600 hover:bg-green-50"
                        }`}
                      >
                        {approving === userDetails.id ? "Updating..." : userDetails.approved ? "Disapprove" : "Approve"}
                      </button>
                      <button
                        onClick={() => setSelectedUser(userDetails)}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-md transition"
                        style={{ backgroundColor: "#303380" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#252a6b";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#303380";
                        }}
                      >
                        <Key className="w-4 h-4 mr-2" />
                        Reset Password
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

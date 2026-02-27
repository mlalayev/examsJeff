"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Users, Key, Search, Filter, CheckCircle, XCircle, Plus,
  Eye, X, Check, Edit, UserPlus
} from "lucide-react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";
import { AlertModal } from "@/components/modals/AlertModal";
import { UserDetailsModal } from "@/components/modals/UserDetailsModal";

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT" as string,
    branchId: "",
    approved: false,
    phoneNumber: "",
    dateOfBirth: "",
    program: "",
    paymentDate: "",
    paymentAmount: "",
  });
  const [createCreating, setCreateCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; type: "success" | "error" | "info" }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

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
        setAlertModal({
          isOpen: true,
          title: "Password reset successfully",
          message: `User: ${selectedUser.email}\nNew password: ${newPassword}`,
          type: "success",
        });
        setSelectedUser(null);
        setNewPassword("");
        fetchUsers();
      } else {
        const data = await res.json();
        setAlertModal({ isOpen: true, title: "Error", message: data.error || "Failed to reset", type: "error" });
      }
    } catch (error) {
      setAlertModal({ isOpen: true, title: "Error", message: "Failed to reset password", type: "error" });
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
        fetchUsers();
      } else {
        const data = await res.json();
        setAlertModal({ isOpen: true, title: "Error", message: data.error || "Failed to update", type: "error" });
      }
    } catch (error) {
      setAlertModal({ isOpen: true, title: "Error", message: "Failed to update approval status", type: "error" });
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
        setAlertModal({ isOpen: true, title: "Error", message: data.error || "Failed to load", type: "error" });
        setShowDetailsModal(false);
      }
    } catch (error) {
      setAlertModal({ isOpen: true, title: "Error", message: "Failed to fetch user details", type: "error" });
      setShowDetailsModal(false);
    }
    setLoadingDetails(false);
  };

  const handleUpdateUser = async (overrideRole?: string, overrideBranchId?: string) => {
    if (!userDetails) return;

    const roleToSend = overrideRole ?? newRole;
    const branchToSend = overrideBranchId ?? newBranchId;

    setUpdating(true);
    try {
      const res = await fetch(`/api/creator/users/${userDetails.id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approved: userDetails.approved,
          role: roleToSend !== userDetails.role ? roleToSend : undefined,
          branchId: branchToSend !== userDetails.branchId ? (branchToSend || null) : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUserDetails((prev: any) => ({ ...prev, ...data.user }));
        setEditingRole(false);
        setEditingBranch(false);
        fetchUsers();
        setAlertModal({ isOpen: true, title: "Success", message: "User updated successfully", type: "success" });
      } else {
        const data = await res.json();
        setAlertModal({ isOpen: true, title: "Error", message: data.error || "Failed to update", type: "error" });
      }
    } catch (error) {
      setAlertModal({ isOpen: true, title: "Error", message: "Failed to update user", type: "error" });
    }
    setUpdating(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!createFormData.name || !createFormData.email || !createFormData.password) {
      setCreateError("Please fill in all required fields");
      return;
    }
    if (createFormData.password.length < 6) {
      setCreateError("Password must be at least 6 characters");
      return;
    }
    if (createFormData.role === "STUDENT") {
      if (!createFormData.phoneNumber || !createFormData.dateOfBirth || !createFormData.program) {
        setCreateError("Phone number, date of birth, and program are required for students");
        return;
      }
      if (!createFormData.branchId) {
        setCreateError("Branch is required for students");
        return;
      }
    }
    setCreateCreating(true);
    try {
      const payload: any = {
        name: createFormData.name,
        email: createFormData.email,
        password: createFormData.password,
        role: createFormData.role,
        branchId: createFormData.branchId || null,
        approved: createFormData.approved,
      };
      if (createFormData.role === "STUDENT") {
        payload.studentProfile = {
          phoneNumber: createFormData.phoneNumber,
          dateOfBirth: createFormData.dateOfBirth,
          program: createFormData.program,
          paymentDate: createFormData.paymentDate || null,
          paymentAmount: createFormData.paymentAmount || null,
        };
      }
      const res = await fetch("/api/creator/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setCreateFormData({
          name: "",
          email: "",
          password: "",
          role: "STUDENT",
          branchId: "",
          approved: false,
          phoneNumber: "",
          dateOfBirth: "",
          program: "",
          paymentDate: "",
          paymentAmount: "",
        });
        fetchUsers();
        setAlertModal({
          isOpen: true,
          title: "User created successfully",
          message: `Email: ${createFormData.email}\nPassword: ${createFormData.password}\n\nPlease save these credentials.`,
          type: "success",
        });
      } else {
        setCreateError(data.error || "Failed to create user");
      }
    } catch (error) {
      setCreateError("An error occurred while creating user");
    }
    setCreateCreating(false);
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
          onClick={() => {
            setCreateError("");
            setCreateFormData({
              name: "",
              email: "",
              password: "",
              role: "STUDENT",
              branchId: "",
              approved: false,
              phoneNumber: "",
              dateOfBirth: "",
              program: "",
              paymentDate: "",
              paymentAmount: "",
            });
            setShowCreateModal(true);
          }}
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
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[user.role]}`}>
                        {user.role}
                      </span>
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
        loadingDetails ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl p-10 flex flex-col items-center gap-4 shadow-xl">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#303380]"></div>
              <p className="text-sm text-gray-600">Loading user details…</p>
            </div>
          </div>
        ) : userDetails ? (
          <UserDetailsModal
            userDetails={userDetails}
            branches={branches}
            approving={approving}
            updating={updating}
            onClose={() => { setShowDetailsModal(false); setUserDetails(null); }}
            onApprove={handleApprove}
            onUpdateUser={(role, branchId) => {
              setNewRole(role);
              setNewBranchId(branchId);
              handleUpdateUser(role, branchId);
            }}
            onResetPassword={() => setSelectedUser(userDetails)}
          />
        ) : null
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#303380]/10 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-[#303380]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Create New User</h3>
                  <p className="text-sm text-gray-500">Manually create a user account</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="flex-1 overflow-y-auto p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {createError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                  placeholder="Minimum 6 characters"
                />
                <p className="text-xs text-gray-500 mt-0.5">Save this password — you can reset it later from Users.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={createFormData.role}
                  onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Admin</option>
                  <option value="BRANCH_ADMIN">Branch Admin</option>
                  <option value="BRANCH_BOSS">Branch Boss</option>
                  <option value="BOSS">Boss</option>
                  <option value="CREATOR">Creator (Super Admin)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch {createFormData.role === "STUDENT" && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={createFormData.branchId}
                  onChange={(e) => setCreateFormData({ ...createFormData, branchId: e.target.value })}
                  required={createFormData.role === "STUDENT"}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                >
                  <option value="">No Branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
              {createFormData.role === "STUDENT" && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Student Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={createFormData.phoneNumber}
                          onChange={(e) => setCreateFormData({ ...createFormData, phoneNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                          placeholder="+994 XX XXX XX XX"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                        <input
                          type="date"
                          required
                          value={createFormData.dateOfBirth}
                          onChange={(e) => setCreateFormData({ ...createFormData, dateOfBirth: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Program *</label>
                        <input
                          type="text"
                          required
                          value={createFormData.program}
                          onChange={(e) => setCreateFormData({ ...createFormData, program: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                          placeholder="e.g., General English A2"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                          <input
                            type="date"
                            value={createFormData.paymentDate}
                            onChange={(e) => setCreateFormData({ ...createFormData, paymentDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (AZN)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={createFormData.paymentAmount}
                            onChange={(e) => setCreateFormData({ ...createFormData, paymentAmount: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="create-approved"
                  checked={createFormData.approved}
                  onChange={(e) => setCreateFormData({ ...createFormData, approved: e.target.checked })}
                  className="w-4 h-4 text-[#303380] border-gray-300 rounded focus:ring-[#303380]"
                />
                <label htmlFor="create-approved" className="text-sm text-gray-700">
                  Approve user immediately
                </label>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCreating}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-md transition disabled:opacity-50"
                  style={{ backgroundColor: "#303380" }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = "#252a6b";
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = "#303380";
                  }}
                >
                  {createCreating ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal((a) => ({ ...a, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
}

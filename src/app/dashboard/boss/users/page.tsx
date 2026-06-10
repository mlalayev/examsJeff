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
  Trash2,
  DollarSign,
  UserPlus,
} from "lucide-react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";
import StudentPaymentsModal from "@/components/modals/StudentPaymentsModal";
import EditAccountModal from "@/components/modals/EditAccountModal";
import CreateUserModal from "@/components/modals/CreateUserModal";

type UserRole = "STUDENT" | "TEACHER" | "ADMIN" | "BRANCH_ADMIN" | "BRANCH_BOSS";
type ViewMode = "all" | "branch" | "role";
type FilterType = "all" | UserRole;

type BossUserRow = {
  id: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  role: string;
  approved?: boolean;
  branchId?: string | null;
  tags?: string[];
};

type BossBranchRow = { id: string; name: string };

// In-memory cache: prevents “refresh flash” when navigating away/back
let bossUsersCache: { users: BossUserRow[]; branches: BossBranchRow[]; branchMap: Record<string, string> } | null = null;

export default function BossUsersPage() {
  const [users, setUsers] = useState<BossUserRow[]>(bossUsersCache?.users ?? []);
  const [branches, setBranches] = useState<BossBranchRow[]>(bossUsersCache?.branches ?? []);
  const [branchMap, setBranchMap] = useState<Record<string, string>>(bossUsersCache?.branchMap ?? {});
  const [loading, setLoading] = useState(bossUsersCache == null);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  
  // New state for filtering and view modes
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Payments modal
  const [paymentsTarget, setPaymentsTarget] = useState<BossUserRow | null>(null);

  const load = async () => {
    if (!bossUsersCache) setLoading(true);
    const [uRes, bRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/admin/branches"),
    ]);
    const u = await uRes.json();
    const b = await bRes.json();
    const nextUsers: BossUserRow[] = Array.isArray(u.users) ? u.users : [];
    const nextBranches: BossBranchRow[] = Array.isArray(b.branches) ? b.branches : [];
    const nextBranchMap = Object.fromEntries(nextBranches.map((x: any) => [x.id, x.name]));

    bossUsersCache = { users: nextUsers, branches: nextBranches, branchMap: nextBranchMap };

    setUsers(nextUsers);
    setBranches(nextBranches);
    setBranchMap(nextBranchMap);
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

  const handleDeleteUser = async (userId: string, email?: string) => {
    if (!confirm(`Delete this account?\n\n${email || userId}\n\nThis cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Failed to delete user");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      if (bossUsersCache) {
        bossUsersCache = { ...bossUsersCache, users: bossUsersCache.users.filter((u) => u.id !== userId) };
      }
      alert("User deleted successfully");
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user");
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
      <div className="flex flex-wrap items-center gap-4 mb-6">
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
        <button
          onClick={() => setShowCreate(true)}
          className="ml-auto inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white rounded-md transition"
          style={{ backgroundColor: "#303380" }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#252a6b"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#303380"; }}
        >
          <UserPlus className="w-4 h-4" />
          Create User
        </button>
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
                      {(user.branchId && branchMap[user.branchId]) || "—"}
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
                        onClick={() => setEditUserId(user.id)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user.role === "STUDENT" && (
                        <button
                          onClick={() => setPaymentsTarget(user)}
                          className="ml-3 text-emerald-600 hover:text-emerald-800"
                          title="Manage payments"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="ml-3 text-red-500 hover:text-red-700"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
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
      <EditAccountModal
        open={!!editUserId}
        userId={editUserId}
        branches={branches}
        onClose={() => setEditUserId(null)}
        onSaved={load}
      />

      <CreateUserModal
        open={showCreate}
        branches={branches}
        students={users
          .filter((u) => u.role === "STUDENT")
          .map((u) => ({
            id: u.id,
            label:
              [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
              u.name ||
              u.email,
          }))}
        onClose={() => setShowCreate(false)}
        onCreated={load}
      />

      {paymentsTarget && (
        <StudentPaymentsModal
          studentId={paymentsTarget.id}
          studentName={
            [paymentsTarget.firstName, paymentsTarget.lastName].filter(Boolean).join(" ").trim() ||
            paymentsTarget.name ||
            paymentsTarget.email
          }
          open={!!paymentsTarget}
          onClose={() => setPaymentsTarget(null)}
        />
      )}
    </div>
  );
}

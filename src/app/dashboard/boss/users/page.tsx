"use client";

import { usePathname } from "next/navigation";
import UserDirectoryTable, { UserDirectoryRow, DirectoryActions, DirectoryFee } from "@/components/dashboard/UserDirectoryTable";
import StudentExamsModal from "@/components/dashboard/StudentExamsModal";
import { resolveStudyTypes, STUDY_TYPE_MAP } from "@/lib/study-types";
import UserDetailsButton from "@/components/modals/UserDetailsButton";
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
  BookOpen,
} from "lucide-react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";
import StudentPaymentsModal from "@/components/modals/StudentPaymentsModal";
import EditAccountModal from "@/components/modals/EditAccountModal";
import CreateUserModal from "@/components/modals/CreateUserModal";

type UserRole = "STUDENT" | "TEACHER" | "ADMIN" | "BRANCH_ADMIN" | "BRANCH_BOSS" | "PARENT" | "PARTNER";
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
  createdAt?: string;
  studentProfile?: { program?: string | null; studyTypes?: string[]; monthlyFee?: number | string | null } | null;
};

type BossBranchRow = { id: string; name: string };

// In-memory cache: prevents “refresh flash” when navigating away/back
let bossUsersCache: { users: BossUserRow[]; branches: BossBranchRow[]; branchMap: Record<string, string> } | null = null;

export default function BossUsersPage() {
  const pathname = usePathname();
  const pageRole = pathname.endsWith("/parents") ? "PARENT" : pathname.endsWith("/partners") ? "PARTNER" : null;
  const [users, setUsers] = useState<BossUserRow[]>(bossUsersCache?.users ?? []);
  const [branches, setBranches] = useState<BossBranchRow[]>(bossUsersCache?.branches ?? []);
  const [branchMap, setBranchMap] = useState<Record<string, string>>(bossUsersCache?.branchMap ?? {});
  const [loadError, setLoadError] = useState("");
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
  const [examsTarget, setExamsTarget] = useState<BossUserRow | null>(null);

  const load = async () => {
    if (!bossUsersCache) setLoading(true);
    setLoadError("");
    try {
    const [uRes, bRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/branches"),
    ]);
    if (!uRes.ok || !bRes.ok) throw new Error("Could not load users. Please retry.");
    const u = await uRes.json();
    const b = await bRes.json();
    const nextUsers: BossUserRow[] = Array.isArray(u.users) ? u.users.map((x: BossUserRow) => ({ ...x, name: [x.firstName, x.lastName].filter(Boolean).join(" ") || x.name || x.email })) : [];
    const nextBranches: BossBranchRow[] = Array.isArray(b.branches) ? b.branches : [];
    const nextBranchMap = Object.fromEntries(nextBranches.map((x: any) => [x.id, x.name]));

    bossUsersCache = { users: nextUsers, branches: nextBranches, branchMap: nextBranchMap };

    setUsers(nextUsers);
    setBranches(nextBranches);
    setBranchMap(nextBranchMap);
    } catch (e) { setLoadError((e as Error).message); } finally { setLoading(false); }
  };

  // Filter users based on current filters
  const getFilteredUsers = () => {
    let filtered = pageRole ? users.filter(u => u.role === pageRole) : users;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter
    if (!pageRole && roleFilter !== "all") {
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
        <h1 className="text-2xl font-medium text-gray-900">{pageRole === "PARENT" ? "Parents" : pageRole === "PARTNER" ? "Partners" : "All users"}</h1>
        <p className="text-gray-500 mt-1">Accounts, profiles and payments in one place.</p>
      </div>

      {/* Compact Stats Row */}
      <div className="flex flex-wrap items-center gap-8 mb-8 text-sm">
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
          disabled={!!pageRole}
          value={pageRole || roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as FilterType)}
          className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
        >
          <option value="all">All Roles</option>
          <option value="STUDENT">Students</option>
          <option value="TEACHER">Teachers</option>
          <option value="BRANCH_ADMIN">Branch Admins</option>
          <option value="BRANCH_BOSS">Branch Boss</option>
          <option value="ADMIN">Admins</option>
          <option value="PARENT">Parents</option>
          <option value="PARTNER">Partners</option>
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

      {loadError && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-4 text-rose-700">{loadError} <button onClick={() => void load()} className="underline">Retry</button></p>}
      <UserDirectoryTable loading={loading} empty={filteredUsers.length === 0} showFees={!pageRole} programLabel={pageRole ? "Role" : "Program / role"}>
        {filteredUsers.map(user => <UserDirectoryRow key={user.id} name={user.name} email={user.email}
          program={<div className="flex flex-wrap gap-1">
            {user.role === "STUDENT" && resolveStudyTypes(user.studentProfile?.studyTypes, user.studentProfile?.program).map(id => {
              const type = STUDY_TYPE_MAP[id];
              return type ? <span key={id} className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${type.chip}`}>{type.label}</span> : null;
            })}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{user.role.replaceAll('_', ' ')}</span>
          </div>}
          branch={(user.branchId && branchMap[user.branchId]) || null}
          fee={user.role === "STUDENT" ? <DirectoryFee amount={user.studentProfile?.monthlyFee}/> : null}
          showFees={!pageRole}
          status={<span className={`rounded-full px-2 py-1 text-xs font-medium ${user.approved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{user.approved ? "Approved" : "Pending"}</span>}
          joined={user.createdAt}
          actions={<DirectoryActions>
            <UserDetailsButton userId={user.id}/>
            <button type="button" onClick={() => setEditUserId(user.id)} className="bg-indigo-50 text-[#303380] hover:bg-indigo-100"><Edit size={14}/>Edit</button>
            {user.role === "STUDENT" && <>
              <button type="button" onClick={() => setPaymentsTarget(user)} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100"><DollarSign size={14}/>Payments</button>
              <button type="button" onClick={() => setExamsTarget(user)} className="bg-sky-50 text-sky-700 hover:bg-sky-100"><BookOpen size={14}/>Exams</button>
            </>}
            <button type="button" onClick={() => handleDeleteUser(user.id, user.email)} className="bg-rose-50 text-rose-700 hover:bg-rose-100"><Trash2 size={14}/>Delete</button>
          </DirectoryActions>}
        />)}
      </UserDirectoryTable>
      <StudentExamsModal open={!!examsTarget} student={examsTarget ? { id: examsTarget.id, name: examsTarget.name || null, email: examsTarget.email } : null} onClose={() => setExamsTarget(null)}/>
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

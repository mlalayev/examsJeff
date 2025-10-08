"use client";

import { useEffect, useState } from "react";

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
  };

  const saveUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      // Approval change
      if (approvedDesired && !selectedUser.approved) {
        await fetch(`/api/admin/users/${selectedUser.id}/approve`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: true }),
        });
      }

      // Role change
      if (selectedRole === "BRANCH_ADMIN") {
        if (!selectedBranchId) {
          setSaving(false);
          return;
        }
        await fetch(`/api/admin/users/${selectedUser.id}/assign-branch-admin`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ branchId: selectedBranchId }),
        });
      } else if (selectedRole !== selectedUser.role) {
        await fetch(`/api/admin/users/${selectedUser.id}/role`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: selectedRole }),
        });
      }

      // Branch change for non-branch-admin roles
      if (selectedRole !== "BRANCH_ADMIN" && selectedBranchId && selectedBranchId !== (selectedUser.branchId || "")) {
        await fetch(`/api/admin/users/${selectedUser.id}/approve`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: approvedDesired, branchId: selectedBranchId }),
        });
      }

      setModalOpen(false);
      setSelectedUser(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Users</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Email</th>
                <th className="text-left px-3 py-2">Role</th>
                <th className="text-left px-3 py-2">Branch</th>
                <th className="text-left px-3 py-2">Approved</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => openUserModal(u)}>
                  <td className="px-3 py-2">{u.name || "—"}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.role}</td>
                  <td className="px-3 py-2">{branchMap[u.branchId] || "—"}</td>
                  <td className="px-3 py-2">{u.approved ? <span className="text-green-600">Yes</span> : <span className="text-amber-600">No</span>}</td>
                  <td className="px-3 py-2 text-gray-500">Click row</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Manage User</h3>
            <div className="grid grid-cols-1 gap-3 text-sm mb-4">
              <div><span className="text-gray-500">Name:</span> {selectedUser.name || "—"}</div>
              <div><span className="text-gray-500">Email:</span> {selectedUser.email}</div>
              <div><span className="text-gray-500">Current Branch:</span> {branchMap[selectedUser.branchId] || "—"}</div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Role</label>
                <select className="w-full border rounded px-3 py-2" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                  <option value="STUDENT">STUDENT</option>
                  <option value="TEACHER">TEACHER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="BRANCH_ADMIN">BRANCH_ADMIN</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Branch</label>
                <select className="w-full border rounded px-3 py-2" value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}>
                  <option value="">—</option>
                  {branches.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Required if setting role to BRANCH_ADMIN. Optional for others.</p>
              </div>
              <div className="flex items-center gap-2">
                <input id="approve" type="checkbox" className="w-4 h-4" checked={approvedDesired} onChange={(e) => setApprovedDesired(e.target.checked)} />
                <label htmlFor="approve" className="text-sm">Approved</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="px-4 py-2 rounded border" onClick={() => { setModalOpen(false); setSelectedUser(null); }}>Cancel</button>
              <button disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50" onClick={saveUser}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  _count: {
    classesTeaching: number;
    classEnrollments: number;
    bookingsAsStudent: number;
  };
}

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set("role", roleFilter);
      if (search) params.set("search", search);
      
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchUsers();
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Change user role to ${newRole}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        await fetchUsers();
        alert("Role updated successfully");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (loading) return <UnifiedLoading type="spinner" variant="spinner" size="md" />;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">User Management</h2>
        
        <div className="flex gap-3">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by name or email..."
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="TEACHER">Teachers</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{user.name || "—"}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === "ADMIN" ? "bg-red-100 text-red-800" :
                    user.role === "TEACHER" ? "bg-purple-100 text-purple-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {user.role === "TEACHER" && `${user._count.classesTeaching} classes`}
                  {user.role === "STUDENT" && `${user._count.bookingsAsStudent} bookings`}
                  {user.role === "ADMIN" && "—"}
                </td>
                <td className="px-4 py-3 text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="TEACHER">TEACHER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {users.length === 0 && (
        <div className="text-center py-8 text-gray-600">
          No users found
        </div>
      )}
    </div>
  );
}


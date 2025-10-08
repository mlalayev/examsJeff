"use client";

import { useEffect, useState } from "react";

export default function BossBranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/branches");
    const data = await res.json();
    setBranches(data.branches || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    await fetch("/api/admin/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setName("");
    setCreating(false);
    load();
  };

  return (
    <div className="max-w-[900px] mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Branches</h1>

      <form onSubmit={create} className="flex gap-2 mb-6">
        <input className="border px-3 py-2 rounded w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="New branch name" required />
        <button disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded">{creating ? "Adding..." : "Add"}</button>
      </form>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="px-3 py-2">{b.name}</td>
                  <td className="px-3 py-2">{new Date(b.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}



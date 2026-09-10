"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";

type RosterRow = {
  enrollmentId: string;
  student: { id: string; email: string; name: string | null };
  enrolledAt: string;
  latestAttempt: {
    id: string;
    bandOverall: number | null;
    status: string;
    createdAt: string;
  } | null;
};

export default function ClassManagePage() {
  const params = useParams();
  const router = useRouter();
  const classId = String(params?.id || "");

  const [className, setClassName] = useState("");
  const [editName, setEditName] = useState("");
  const [editing, setEditing] = useState(false);
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentEmail, setStudentEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/classes/${classId}/roster`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Failed to load class (${res.status})`);
      }
      setClassName(data.class?.name || "");
      setEditName(data.class?.name || "");
      setRoster(data.roster || []);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to load class");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveName = async () => {
    if (!editName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to rename class");
      setClassName(data.class?.name || editName.trim());
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rename failed");
    } finally {
      setBusy(false);
    }
  };

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentEmail.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/classes/${classId}/add-student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentEmail: studentEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to add student");
      setStudentEmail("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add student failed");
    } finally {
      setBusy(false);
    }
  };

  const removeStudent = async (studentId: string, label: string) => {
    if (!confirm(`Remove ${label} from this class?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/classes/${classId}/remove-student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to remove student");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setBusy(false);
    }
  };

  const deleteClass = async () => {
    if (
      !confirm(
        `Delete class "${className}"? Enrolled students will be unlinked from this class only.`
      )
    )
      return;
    setBusy(true);
    try {
      const res = await fetch(`/api/classes/${classId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete class");
      router.push("/dashboard/creator/classes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setBusy(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/creator/classes"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Classes
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading class…</div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="rounded-md border border-gray-200 px-3 py-2 text-lg font-medium focus:border-gray-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={saveName}
                    className="rounded-md px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: "#303380" }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setEditName(className);
                    }}
                    className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-medium text-gray-900 sm:text-2xl">
                    {className || "Class"}
                  </h1>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    title="Rename"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {roster.length} enrolled student{roster.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/dashboard/teacher/analytics/${classId}`}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Link>
              <button
                type="button"
                disabled={busy}
                onClick={deleteClass}
                className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={addStudent}
            className="mb-6 flex flex-col gap-2 rounded-md border border-gray-200 bg-white p-4 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Add student by email
              </label>
              <input
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={busy || !studentEmail.trim()}
              className="inline-flex items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "#303380" }}
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </form>

          <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
            {roster.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                No students enrolled yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Enrolled
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Latest attempt
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {roster.map((row) => (
                    <tr key={row.enrollmentId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {row.student.name || "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {row.student.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(row.enrolledAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {row.latestAttempt
                          ? `${row.latestAttempt.status}${
                              row.latestAttempt.bandOverall != null
                                ? ` · ${row.latestAttempt.bandOverall}`
                                : ""
                            }`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            removeStudent(
                              row.student.id,
                              row.student.name || row.student.email
                            )
                          }
                          className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Phone,
  DollarSign,
  Pencil,
  Play,
  RotateCcw,
  BookOpen,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import EditAccountModal from "@/components/modals/EditAccountModal";
import StudentPaymentsModal from "@/components/modals/StudentPaymentsModal";
import StudentExamsModal from "@/components/dashboard/StudentExamsModal";
import {
  LESSON_MODE_MAP,
  STUDY_TYPE_MAP,
  resolveStudyTypes,
} from "@/lib/study-types";

type LifecycleBucket = "FINISHED" | "STOPPED" | "ARCHIVED";

type StudentRow = {
  id: string;
  name: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  approved: boolean;
  createdAt: string;
  branch: { id: string; name: string } | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  program?: string | null;
  studyTypes?: string[];
  lessonModes?: string[];
  studentKind?: string;
  studyStatus?: string;
  archivedAt?: string | null;
  monthlyFee?: number | null;
  lessonsStopped?: boolean;
  lessonsStoppedAt?: string | null;
  currentMonth?: {
    year: number;
    month: number;
    status: string;
    amount: number | null;
    paidAt: string | null;
  };
};

const META: Record<
  LifecycleBucket,
  { title: string; subtitle: string; accent: string }
> = {
  FINISHED: {
    title: "Finished students",
    subtitle:
      "Students who completed their course. Archive them for historical storage, or restore to active if they return.",
    accent: "#2563eb",
  },
  STOPPED: {
    title: "Paused students",
    subtitle:
      "Students whose lessons were paused. Resume them to return to Active Students.",
    accent: "#dc2626",
  },
  ARCHIVED: {
    title: "Archived students",
    subtitle:
      "Finished students moved out of the active lists. Course and payment history remain intact. Unarchive to return them to Finished.",
    accent: "#64748b",
  },
};

export default function StudentLifecycleDashboard({
  bucket,
  studentsListHref,
}: {
  bucket: LifecycleBucket;
  studentsListHref: string;
}) {
  const meta = META[bucket];
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [paymentsStudent, setPaymentsStudent] = useState<StudentRow | null>(null);
  const [examsStudent, setExamsStudent] = useState<StudentRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/students?bucket=${bucket}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to load students (${res.status})`);
      }
      const data = await res.json();
      setStudents(data.students ?? []);
    } catch (e) {
      console.error("Load lifecycle students:", e);
      setError(e instanceof Error ? e.message : "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [bucket]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/branches")
      .then((res) => res.json())
      .then((data) => setBranches(data.branches || []))
      .catch(() => {});
  }, []);

  const patchProfile = async (
    studentId: string,
    profile: Record<string, unknown>
  ) => {
    const res = await fetch(`/api/admin/users/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to update student");
    }
  };

  const restoreStudent = async (student: StudentRow) => {
    const label = student.name || student.email;
    if (
      !confirm(
        bucket === "STOPPED"
          ? `Resume lessons for ${label}? They will return to the active students list.`
          : bucket === "ARCHIVED"
          ? `Unarchive ${label}? They will return to Finished (status unchanged).`
          : `Mark ${label} as continuing again? They will return to the active students list.`
      )
    )
      return;

    setBusyId(student.id);
    setError(null);
    try {
      if (bucket === "STOPPED") {
        const res = await fetch(
          `/api/admin/students/${student.id}/lesson-status`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stopped: false }),
          }
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to resume");
        }
      } else if (bucket === "ARCHIVED") {
        await patchProfile(student.id, { archived: false });
      } else {
        await patchProfile(student.id, { studyStatus: "CONTINUES" });
      }
      await load();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const archiveStudent = async (student: StudentRow) => {
    const label = student.name || student.email;
    if (
      !confirm(
        `Archive ${label}? They leave the Finished list but course and payment history stay intact.`
      )
    )
      return;

    setBusyId(student.id);
    setError(null);
    try {
      await patchProfile(student.id, { archived: true });
      await load();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Archive failed");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = students.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.name || "").toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.phoneNumber || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-gray-900">
            {meta.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500 max-w-2xl">{meta.subtitle}</p>
        </div>
        <Link
          href={studentsListHref}
          className="text-sm font-medium text-[#303380] hover:underline"
        >
          ← Active Students
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-200 py-2 pl-10 pr-3 text-sm focus:border-gray-400 focus:outline-none"
          />
        </div>
        <div className="text-sm text-gray-500">
          <Users className="mr-1 inline h-4 w-4" />
          {filtered.length} student{filtered.length === 1 ? "" : "s"}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No students in this list.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Program
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Branch
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Fee
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Status date
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((student) => {
                  const types = resolveStudyTypes(
                    student.studyTypes,
                    student.program
                  );
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {student.name || "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {student.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {student.phoneNumber ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {student.phoneNumber}
                          </span>
                        ) : (
                          "—"
                        )}
                        {student.dateOfBirth && (
                          <div className="mt-0.5 text-xs text-gray-500">
                            DOB:{" "}
                            {new Date(student.dateOfBirth).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {types.map((id) => {
                            const t = STUDY_TYPE_MAP[id];
                            if (!t) return null;
                            return (
                              <span
                                key={id}
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${t.chip}`}
                              >
                                {t.label}
                              </span>
                            );
                          })}
                        </div>
                        {student.lessonModes &&
                          student.lessonModes.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {student.lessonModes.map((id) => {
                                const m = LESSON_MODE_MAP[id];
                                if (!m) return null;
                                return (
                                  <span
                                    key={id}
                                    className={`rounded-full px-2 py-0.5 text-xs ring-1 ${m.chip}`}
                                  >
                                    {m.label}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {student.branch?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {student.monthlyFee != null && student.monthlyFee > 0
                          ? `${student.monthlyFee.toFixed(2)} AZN`
                          : "—"}
                        {student.currentMonth && (
                          <div className="mt-0.5 text-xs text-gray-500">
                            This month: {student.currentMonth.status}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {bucket === "STOPPED" && student.lessonsStoppedAt
                          ? new Date(
                              student.lessonsStoppedAt
                            ).toLocaleDateString()
                          : bucket === "ARCHIVED" && student.archivedAt
                          ? new Date(student.archivedAt).toLocaleDateString()
                          : bucket === "FINISHED"
                          ? "Completed"
                          : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditUserId(student.id)}
                            className="inline-flex items-center gap-1 rounded bg-[#303380]/10 px-2 py-1 text-xs font-medium text-[#303380] hover:bg-[#303380]/20"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentsStudent(student)}
                            className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                          >
                            <DollarSign className="h-3 w-3" />
                            Payments
                          </button>
                          <button
                            type="button"
                            onClick={() => setExamsStudent(student)}
                            className="inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
                          >
                            <BookOpen className="h-3 w-3" />
                            Exams
                          </button>
                          {bucket === "FINISHED" && (
                            <button
                              type="button"
                              disabled={busyId === student.id}
                              onClick={() => archiveStudent(student)}
                              className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                            >
                              <Archive className="h-3 w-3" />
                              Archive
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={busyId === student.id}
                            onClick={() => restoreStudent(student)}
                            className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                          >
                            {bucket === "STOPPED" ? (
                              <Play className="h-3 w-3" />
                            ) : bucket === "ARCHIVED" ? (
                              <ArchiveRestore className="h-3 w-3" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            {bucket === "STOPPED"
                              ? "Resume"
                              : bucket === "ARCHIVED"
                              ? "Unarchive"
                              : "Restore"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editUserId && (
        <EditAccountModal
          open={!!editUserId}
          userId={editUserId}
          branches={branches}
          onClose={() => setEditUserId(null)}
          onSaved={() => {
            setEditUserId(null);
            load();
          }}
        />
      )}
      {paymentsStudent && (
        <StudentPaymentsModal
          studentId={paymentsStudent.id}
          studentName={paymentsStudent.name || paymentsStudent.email}
          open={!!paymentsStudent}
          onClose={() => setPaymentsStudent(null)}
          onChanged={load}
        />
      )}
      <StudentExamsModal
        open={!!examsStudent}
        onClose={() => setExamsStudent(null)}
        student={examsStudent}
      />
    </div>
  );
}

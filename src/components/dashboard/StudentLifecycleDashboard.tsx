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
} from "lucide-react";
import EditAccountModal from "@/components/modals/EditAccountModal";
import StudentPaymentsModal from "@/components/modals/StudentPaymentsModal";
import StudentExamsModal from "@/components/dashboard/StudentExamsModal";
import {
  LESSON_MODE_MAP,
  STUDY_TYPE_MAP,
  resolveStudyTypes,
} from "@/lib/study-types";

type LifecycleBucket = "FINISHED" | "STOPPED";

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
    subtitle: "Students who completed their course. Restore them to active if they return.",
    accent: "#2563eb",
  },
  STOPPED: {
    title: "Stopped students",
    subtitle: "Students whose lessons were paused or stopped.",
    accent: "#dc2626",
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
  const [restoring, setRestoring] = useState<string | null>(null);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/students?bucket=${bucket}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students ?? []);
      }
    } catch (e) {
      console.error("Load lifecycle students:", e);
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

  const restoreStudent = async (student: StudentRow) => {
    const label = student.name || student.email;
    if (
      !confirm(
        bucket === "STOPPED"
          ? `Resume lessons for ${label}? They will return to the active students list.`
          : `Mark ${label} as continuing again? They will return to the active students list.`
      )
    )
      return;

    setRestoring(student.id);
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
      } else {
        const res = await fetch(`/api/admin/users/${student.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile: { studyStatus: "CONTINUES" },
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to restore");
        }
      }
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
    } catch (err) {
      alert((err as Error).message || "Failed to restore student");
    } finally {
      setRestoring(null);
    }
  };

  const filtered = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.email.toLowerCase().includes(q) ||
      (s.name ?? "").toLowerCase().includes(q) ||
      (s.phoneNumber ?? "").includes(q)
    );
  });

  return (
    <div className="max-w-[100vw] overflow-x-hidden p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
            <Link href={studentsListHref} className="hover:text-[#303380]">
              Students
            </Link>
            <span>/</span>
            <span className="font-medium text-gray-700">{meta.title}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{meta.title}</h1>
          <p className="mt-1 text-sm text-gray-600">{meta.subtitle}</p>
        </div>
        <div
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: meta.accent }}
        >
          <Users className="h-4 w-4" />
          {students.length} total
        </div>
      </div>

      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, or phone…"
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#303380] focus:ring-2 focus:ring-[#303380]/30"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p>No {bucket === "FINISHED" ? "finished" : "stopped"} students</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Study
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Branch
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Fee / month
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    {bucket === "STOPPED" ? "Stopped since" : "Finished"}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
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
                        {student.lessonModes && student.lessonModes.length > 0 && (
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
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {bucket === "STOPPED" && student.lessonsStoppedAt
                          ? new Date(student.lessonsStoppedAt).toLocaleDateString()
                          : bucket === "FINISHED"
                          ? "Completed"
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
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
                          <button
                            type="button"
                            disabled={restoring === student.id}
                            onClick={() => restoreStudent(student)}
                            className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                          >
                            {bucket === "STOPPED" ? (
                              <Play className="h-3 w-3" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            {bucket === "STOPPED" ? "Resume" : "Restore"}
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

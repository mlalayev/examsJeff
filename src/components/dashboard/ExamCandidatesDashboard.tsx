"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Phone,
  DollarSign,
  Pencil,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import EditAccountModal from "@/components/modals/EditAccountModal";
import StudentPaymentsModal from "@/components/modals/StudentPaymentsModal";
import StudentExamsModal from "@/components/dashboard/StudentExamsModal";
import {
  LESSON_MODE_MAP,
  STUDY_TYPE_MAP,
  resolveStudyTypes,
} from "@/lib/study-types";

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
  currentMonth?: {
    year: number;
    month: number;
    status: string;
    amount: number | null;
    paidAt: string | null;
  };
};

const ACCENT = "#7c3aed";

export default function ExamCandidatesDashboard({
  studentsListHref,
}: {
  studentsListHref: string;
}) {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [paymentsStudent, setPaymentsStudent] = useState<StudentRow | null>(null);
  const [examsStudent, setExamsStudent] = useState<StudentRow | null>(null);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/students?bucket=EXAM_TAKER");
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students ?? []);
      }
    } catch (e) {
      console.error("Load exam candidates:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/branches")
      .then((res) => res.json())
      .then((data) => setBranches(data.branches || []))
      .catch(() => {});
  }, []);

  const enrollAsStudent = async (student: StudentRow) => {
    const label = student.name || student.email;
    if (
      !confirm(
        `Enroll ${label} as a regular student?\n\nThey will move to the main Students list and can attend lessons.`
      )
    )
      return;

    setEnrolling(student.id);
    try {
      const res = await fetch(`/api/admin/users/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: { studentKind: "STUDENT", studyStatus: "CONTINUES" },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to enroll student");
      }
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
    } catch (err) {
      alert((err as Error).message || "Failed to enroll student");
    } finally {
      setEnrolling(null);
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
            <span className="font-medium text-gray-700">Exam candidates</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Exam candidates</h1>
          <p className="mt-1 text-sm text-gray-600">
            People registered for exams only — not enrolled in regular lessons.
          </p>
        </div>
        <div
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: ACCENT }}
        >
          <Users className="h-4 w-4" />
          {students.length} total
        </div>
      </div>

      <div className="relative mb-4 max-w-md">
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
            <p>No exam candidates</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Candidate
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Exam focus
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Branch
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Fee / month
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
                        <div className="text-xs text-gray-500">{student.email}</div>
                        <span
                          className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: ACCENT }}
                        >
                          Exam candidate
                        </span>
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
                          {types.length > 0 ? (
                            types.map((id) => {
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
                            })
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
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
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
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
                            disabled={enrolling === student.id}
                            onClick={() => enrollAsStudent(student)}
                            className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                          >
                            <GraduationCap className="h-3 w-3" />
                            Enroll as student
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

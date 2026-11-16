"use client";

import UserDirectoryTable, { UserDirectoryRow, DirectoryActions, DirectoryFee, DirectoryProgram } from "@/components/dashboard/UserDirectoryTable";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import UserDetailsButton from "@/components/modals/UserDetailsButton";
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
  parentHref,
  parentLabel,
}: {
  studentsListHref: string;
  parentHref?: string;
  parentLabel?: string;
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
        `Enroll ${label} as a regular student?\n\nThey will move to Active Students and can attend lessons.`
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
            <Link href={parentHref ?? studentsListHref} className="hover:text-[#303380]">
              {parentLabel ?? "Students"}
            </Link>
            <span>/</span>
            <span className="font-medium text-gray-700">Sunday examiners</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sunday examiners</h1>
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

      <UserDirectoryTable loading={loading} empty={filtered.length === 0} emptyMessage="No students found">
        {filtered.map((student) => {
          return <UserDirectoryRow key={student.id} name={student.name} email={student.email}
            program={<DirectoryProgram program={student.program} studyTypes={student.studyTypes} lessonModes={student.lessonModes}/>} branch={student.branch?.name}
            fee={<DirectoryFee amount={student.monthlyFee} status={student.currentMonth?.status}/>}
            status={<><span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">Exam candidate</span></>} joined={student.createdAt}
            actions={<DirectoryActions>
<UserDetailsButton userId={student.id} />
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
                        </DirectoryActions>}
          />;
        })}
      </UserDirectoryTable>

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

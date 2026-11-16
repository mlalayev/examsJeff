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
    title: "Alumni",
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

      <UserDirectoryTable loading={loading} empty={filtered.length === 0} emptyMessage="No students found">
        {filtered.map((student) => {
          return <UserDirectoryRow key={student.id} name={student.name} email={student.email}
            program={<DirectoryProgram program={student.program} studyTypes={student.studyTypes} lessonModes={student.lessonModes}/>} branch={student.branch?.name}
            fee={<DirectoryFee amount={student.monthlyFee} status={student.currentMonth?.status}/>}
            status={<><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">{bucket === "FINISHED" ? "Completed" : bucket === "ARCHIVED" ? "Archived" : "Paused"}</span><span className="text-xs text-slate-500">
                        {bucket === "STOPPED" && student.lessonsStoppedAt
                          ? new Date(
                              student.lessonsStoppedAt
                            ).toLocaleDateString()
                          : bucket === "ARCHIVED" && student.archivedAt
                          ? new Date(student.archivedAt).toLocaleDateString()
                          : null}
                      </span></>} joined={student.createdAt}
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

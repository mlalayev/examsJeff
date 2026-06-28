"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AlertModal } from "@/components/modals/AlertModal";
import type { HomeworkDashboardRole } from "@/lib/homework-dashboard";

type StudentOption = { id: string; name: string; email: string };
type ClassOption = {
  id: string;
  name: string;
  students: StudentOption[];
};

type Props = {
  role: HomeworkDashboardRole;
  examId: string;
  examTitle: string;
  onClose: () => void;
  onAssigned: () => void;
};

export default function AssignHomeworkModal({
  role,
  examId,
  examTitle,
  onClose,
  onAssigned,
}: Props) {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [dueAt, setDueAt] = useState("");
  const [isExtra, setIsExtra] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: "success" | "error";
  }>({ isOpen: false, title: "", message: "" });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (role === "teacher") {
          const res = await fetch("/api/teacher/classes");
          const data = await res.json();
          if (res.ok && Array.isArray(data)) {
            setClasses(data);
          }
        } else {
          const res = await fetch("/api/admin/users?role=STUDENT");
          const data = await res.json();
          const list = Array.isArray(data.users) ? data.users : [];
          setStudents(
            list.map((u: { id: string; firstName?: string; lastName?: string; email: string }) => ({
              id: u.id,
              name:
                [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
                u.email.split("@")[0],
              email: u.email,
            }))
          );
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [role]);

  const classStudents =
    classes.find((c) => c.id === selectedClass)?.students ?? [];

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    const studentIds =
      role === "teacher"
        ? selectedStudents
        : selectedStudents;

    if (studentIds.length === 0) {
      setAlert({
        isOpen: true,
        title: "Validation",
        message: "Select at least one student.",
        type: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/homework/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId,
          studentIds,
          classId: selectedClass || undefined,
          dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
          isExtra,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to assign homework");
      }
      onAssigned();
    } catch (e) {
      setAlert({
        isOpen: true,
        title: "Error",
        message: e instanceof Error ? e.message : "Failed to assign",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-medium text-gray-900">Assign Homework</h2>
            <p className="text-sm text-gray-500 mt-0.5">{examTitle}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading students...</p>
          ) : role === "teacher" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedStudents([]);
                  }}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Select class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedClass ? (
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md divide-y">
                  {classStudents.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(s.id)}
                        onChange={() => toggleStudent(s.id)}
                      />
                      <span>{s.name}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-md divide-y">
              {students.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(s.id)}
                    onChange={() => toggleStudent(s.id)}
                  />
                  <span>
                    {s.name}
                    <span className="text-gray-400 ml-1">({s.email})</span>
                  </span>
                </label>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isExtra}
              onChange={(e) => setIsExtra(e.target.checked)}
            />
            Mark as extra practice
          </label>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleAssign}
            className="px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50"
            style={{ backgroundColor: "#303380" }}
          >
            {submitting ? "Assigning..." : "Assign"}
          </button>
        </div>
      </div>

      <AlertModal
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert((a) => ({ ...a, isOpen: false }))}
      />
    </div>
  );
}

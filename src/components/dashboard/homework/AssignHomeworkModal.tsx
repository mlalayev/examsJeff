"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Search } from "lucide-react";
import { AlertModal } from "@/components/modals/AlertModal";
import type { HomeworkDashboardRole } from "@/lib/homework-dashboard";

type StudentOption = {
  id: string;
  name: string;
  email: string;
  className?: string | null;
};

type ClassOption = { id: string; name: string };

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
  const isTeacher = role === "teacher";
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [search, setSearch] = useState("");
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

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      if (isTeacher) {
        const params = new URLSearchParams();
        if (selectedClass) params.set("classId", selectedClass);
        if (search.trim()) params.set("search", search.trim());
        const res = await fetch(`/api/teacher/homework/students?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load students");
        setStudents(data.students ?? []);
        if (!selectedClass && !search.trim()) {
          setClasses(data.classes ?? []);
        }
      } else {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        const res = await fetch(`/api/admin/homework/students?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load students");
        setStudents(data.students ?? []);
      }
    } catch (e) {
      setAlert({
        isOpen: true,
        title: "Error",
        message: e instanceof Error ? e.message : "Failed to load students",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [isTeacher, selectedClass, search]);

  useEffect(() => {
    const t = setTimeout(loadStudents, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadStudents, search]);

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedStudents(students.map((s) => s.id));
  };

  const clearSelection = () => setSelectedStudents([]);

  const handleAssign = async () => {
    if (selectedStudents.length === 0) {
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
          studentIds: selectedStudents,
          classId: isTeacher && selectedClass ? selectedClass : undefined,
          dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
          isExtra,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to assign homework");
      }
      setAlert({
        isOpen: true,
        title: "Assigned",
        message: `Homework assigned to ${data.count ?? selectedStudents.length} student(s).`,
        type: "success",
      });
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
          {isTeacher && classes.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedStudents([]);
                }}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All my students</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isTeacher ? "Your students" : "Students"}
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md"
              />
            </div>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={selectAll}
                disabled={loading || students.length === 0}
                className="text-xs font-medium text-gray-700 hover:text-gray-900 disabled:opacity-40"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={clearSelection}
                disabled={selectedStudents.length === 0}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-40"
              >
                Clear
              </button>
              <span className="text-xs text-gray-400 ml-auto">
                {selectedStudents.length} selected
              </span>
            </div>
            {loading ? (
              <p className="text-sm text-gray-500 py-4">Loading students...</p>
            ) : students.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 border border-gray-200 rounded-md px-3">
                {isTeacher
                  ? "No students found. Add students to your classes first."
                  : "No students found."}
              </p>
            ) : (
              <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-md divide-y">
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
                    <span className="flex-1 min-w-0">
                      <span className="block truncate">{s.name}</span>
                      <span className="block text-xs text-gray-400 truncate">
                        {s.email}
                        {s.className ? ` · ${s.className}` : ""}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due date (optional)
            </label>
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
            disabled={submitting || selectedStudents.length === 0}
            onClick={handleAssign}
            className="px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50"
            style={{ backgroundColor: "#303380" }}
          >
            {submitting
              ? "Assigning..."
              : `Assign to ${selectedStudents.length || 0} student(s)`}
          </button>
        </div>
      </div>

      <AlertModal
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => {
          const wasSuccess = alert.type === "success";
          setAlert((a) => ({ ...a, isOpen: false }));
          if (wasSuccess) onAssigned();
        }}
      />
    </div>
  );
}

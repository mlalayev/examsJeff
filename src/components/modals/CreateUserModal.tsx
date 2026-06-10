"use client";

import { useState } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";
import ToggleChips from "@/components/forms/ToggleChips";
import {
  STUDY_TYPES,
  LESSON_MODES,
  STUDENT_KIND_OPTIONS,
  STUDENT_STATUS_OPTIONS,
} from "@/lib/study-types";

type Branch = { id: string; name: string };
type ChildOption = { id: string; label: string };

type Props = {
  open: boolean;
  branches: Branch[];
  /** Students available to attach to a PARENT account. */
  students?: ChildOption[];
  onClose: () => void;
  onCreated?: () => void;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  branchId: string;
  approved: boolean;
  phoneNumber: string;
  dateOfBirth: string;
  paymentDate: string;
  paymentAmount: string;
  studyTypes: string[];
  lessonModes: string[];
  studentKind: string;
  studyStatus: string;
  childIds: string[];
};

const ROLE_OPTIONS = [
  { value: "STUDENT", label: "Student" },
  { value: "TEACHER", label: "Teacher" },
  { value: "ADMIN", label: "Admin" },
  { value: "PARENT", label: "Parent" },
  { value: "PARTNER", label: "Partner" },
];

const ACCENT = "#303380";

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "STUDENT",
  branchId: "",
  approved: true,
  phoneNumber: "",
  dateOfBirth: "",
  paymentDate: "",
  paymentAmount: "",
  studyTypes: [],
  lessonModes: [],
  studentKind: "STUDENT",
  studyStatus: "CONTINUES",
  childIds: [],
};

const inputCls =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#303380]/30 focus:border-[#303380]";

export default function CreateUserModal({
  open,
  branches,
  students = [],
  onClose,
  onCreated,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleIn = (key: "studyTypes" | "lessonModes", id: string) =>
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(id)
        ? prev[key].filter((x) => x !== id)
        : [...prev[key], id],
    }));

  const reset = () => {
    setForm(emptyForm);
    setError("");
  };

  const close = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const handleCreate = async () => {
    setError("");
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password) {
      setError("Please fill in all required fields");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (form.role === "STUDENT") {
      if (!form.phoneNumber || !form.dateOfBirth) {
        setError("Phone number and date of birth are required for students");
        return;
      }
      if (form.studyTypes.length === 0) {
        setError("Select at least one study type for the student");
        return;
      }
      if (!form.branchId) {
        setError("Branch is required for students");
        return;
      }
    }
    if (form.role === "PARENT" && form.childIds.length === 0) {
      setError("Select at least one child for a parent account");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        branchId: form.branchId || null,
        approved: form.approved,
      };
      if (form.role === "STUDENT") {
        payload.studentProfile = {
          phoneNumber: form.phoneNumber,
          dateOfBirth: form.dateOfBirth,
          paymentDate: form.paymentDate || null,
          paymentAmount: form.paymentAmount || null,
          studyTypes: form.studyTypes,
          lessonModes: form.lessonModes,
          studentKind: form.studentKind,
          studyStatus: form.studyStatus,
        };
      }
      if (form.role === "PARENT") {
        payload.childIds = form.childIds;
      }

      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to create user");
        return;
      }
      onCreated?.();
      reset();
      onClose();
    } catch {
      setError("An error occurred while creating the user");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const isStudent = form.role === "STUDENT";
  const isParent = form.role === "PARENT";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${ACCENT}1a` }}
            >
              <UserPlus className="w-5 h-5" style={{ color: ACCENT }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create User</h2>
              <p className="text-sm text-gray-500">Add a new account to the platform</p>
            </div>
          </div>
          <button
            onClick={close}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First name" required>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                className={inputCls}
                placeholder="John"
              />
            </Field>
            <Field label="Last name" required>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                className={inputCls}
                placeholder="Doe"
              />
            </Field>
            <Field label="Email" required>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={inputCls}
                placeholder="john@example.com"
              />
            </Field>
            <Field label="Password" required>
              <input
                type="text"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                className={inputCls}
                placeholder="Minimum 6 characters"
              />
            </Field>
            <Field label="Role">
              <select
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
                className={inputCls}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={`Branch${isStudent ? " *" : ""}`}>
              <select
                value={form.branchId}
                onChange={(e) => set("branchId", e.target.value)}
                className={inputCls}
              >
                <option value="">No branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Student details */}
          {isStudent && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Student details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Account type">
                  <select
                    value={form.studentKind}
                    onChange={(e) => set("studentKind", e.target.value)}
                    className={inputCls}
                  >
                    {STUDENT_KIND_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Status">
                  <select
                    value={form.studyStatus}
                    onChange={(e) => set("studyStatus", e.target.value)}
                    className={inputCls}
                  >
                    {STUDENT_STATUS_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Phone number" required>
                  <input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(e) => set("phoneNumber", e.target.value)}
                    className={inputCls}
                    placeholder="+994 XX XXX XX XX"
                  />
                </Field>
                <Field label="Date of birth" required>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => set("dateOfBirth", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Monthly fee (AZN)">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.paymentAmount}
                    onChange={(e) => set("paymentAmount", e.target.value)}
                    className={inputCls}
                    placeholder="0.00"
                  />
                </Field>
                <Field label="First payment date">
                  <input
                    type="date"
                    value={form.paymentDate}
                    onChange={(e) => set("paymentDate", e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Study types <span className="text-gray-400 font-normal">(choose one or more)</span>
                </label>
                <ToggleChips
                  options={STUDY_TYPES.map((t) => ({ id: t.id, label: t.label, accent: t.accent }))}
                  selected={form.studyTypes}
                  onToggle={(id) => toggleIn("studyTypes", id)}
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson modes <span className="text-gray-400 font-normal">(choose one or more)</span>
                </label>
                <ToggleChips
                  options={LESSON_MODES.map((m) => ({ id: m.id, label: m.label }))}
                  selected={form.lessonModes}
                  onToggle={(id) => toggleIn("lessonModes", id)}
                />
              </div>
            </div>
          )}

          {/* Parent: select children */}
          {isParent && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Children <span className="text-red-500">*</span>
              </h3>
              <div className="border border-gray-200 rounded-lg p-3 max-h-56 overflow-y-auto space-y-2">
                {students.length === 0 ? (
                  <p className="text-sm text-gray-500">No students available.</p>
                ) : (
                  students.map((s) => {
                    const checked = form.childIds.includes(s.id);
                    return (
                      <label key={s.id} className="flex items-center gap-3 text-sm text-gray-800">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? Array.from(new Set([...form.childIds, s.id]))
                              : form.childIds.filter((id) => id !== s.id);
                            set("childIds", next);
                          }}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="truncate">{s.label}</span>
                      </label>
                    );
                  })
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Selected: {form.childIds.length}</p>
            </div>
          )}

          <div className="mt-5 flex items-center gap-2">
            <input
              id="create-approved"
              type="checkbox"
              checked={form.approved}
              onChange={(e) => set("approved", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label htmlFor="create-approved" className="text-sm font-medium text-gray-700">
              Approve immediately
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={close}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ backgroundColor: ACCENT }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = "#252a6b";
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = ACCENT;
            }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {saving ? "Creating…" : "Create user"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

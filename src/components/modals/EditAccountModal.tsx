"use client";

import { useEffect, useState } from "react";
import { X, User as UserIcon, Loader2, KeyRound, Coins } from "lucide-react";
import ToggleChips from "@/components/forms/ToggleChips";
import ManualCoinModal from "@/components/coins/ManualCoinModal";
import CoinStudentHistoryPanel from "@/components/coins/CoinStudentHistoryPanel";
import {
  STUDY_TYPES,
  LESSON_MODES,
  STUDENT_KIND_OPTIONS,
  STUDENT_STATUS_OPTIONS,
  resolveStudyTypes,
} from "@/lib/study-types";

type Branch = { id: string; name: string };

type Props = {
  open: boolean;
  userId: string | null;
  branches: Branch[];
  onClose: () => void;
  onSaved?: () => void;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  branchId: string;
  approved: boolean;
  password: string;
  phoneNumber: string;
  dateOfBirth: string;
  monthlyFee: string;
  studyTypes: string[];
  lessonModes: string[];
  studentKind: string;
  studyStatus: string;
};

const ROLE_OPTIONS = [
  { value: "STUDENT", label: "Student" },
  { value: "TEACHER", label: "Teacher" },
  { value: "PARENT", label: "Parent" },
  { value: "PARTNER", label: "Partner" },
  { value: "BRANCH_ADMIN", label: "Branch Admin" },
  { value: "BRANCH_BOSS", label: "Branch Boss" },
  { value: "ADMIN", label: "Admin" },
  { value: "BOSS", label: "Boss" },
];

const ACCENT = "#303380";

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  role: "STUDENT",
  branchId: "",
  approved: false,
  password: "",
  phoneNumber: "",
  dateOfBirth: "",
  monthlyFee: "",
  studyTypes: [],
  lessonModes: [],
  studentKind: "STUDENT",
  studyStatus: "CONTINUES",
};

const toDateInput = (value: string | null | undefined) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

export default function EditAccountModal({
  open,
  userId,
  branches,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [coinBalance, setCoinBalance] = useState(0);
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [coinHistoryRefresh, setCoinHistoryRefresh] = useState(0);

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/admin/users/${userId}`);
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data.error || "Failed to load account");
          return;
        }
        if (cancelled) return;
        const u = data.user;
        setForm({
          firstName: u.firstName ?? "",
          lastName: u.lastName ?? "",
          email: u.email ?? "",
          role: u.role ?? "STUDENT",
          branchId: u.branchId ?? "",
          approved: !!u.approved,
          password: "",
          phoneNumber: u.profile?.phoneNumber ?? "",
          dateOfBirth: toDateInput(u.profile?.dateOfBirth),
          monthlyFee:
            u.profile?.monthlyFee != null ? String(u.profile.monthlyFee) : "",
          studyTypes: resolveStudyTypes(u.profile?.studyTypes, u.profile?.program),
          lessonModes: Array.isArray(u.profile?.lessonModes) ? u.profile.lessonModes : [],
          studentKind: u.profile?.studentKind ?? "STUDENT",
          studyStatus: u.profile?.studyStatus ?? "CONTINUES",
        });
        setCoinBalance(u.profile?.coinBalance ?? 0);
      } catch {
        if (!cancelled) setError("Failed to load account");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleIn = (key: "studyTypes" | "lessonModes", id: string) =>
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(id)
        ? prev[key].filter((x) => x !== id)
        : [...prev[key], id],
    }));

  const showProfileFields = form.role === "STUDENT" || form.role === "TEACHER";

  const handleSave = async () => {
    if (!userId) return;
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First and last name are required");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required");
      return;
    }
    if (form.password && form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        role: form.role,
        branchId: form.branchId || null,
        approved: form.approved,
      };
      if (form.password) payload.password = form.password;
      if (showProfileFields) {
        payload.profile = {
          phoneNumber: form.phoneNumber || null,
          dateOfBirth: form.dateOfBirth || null,
          ...(form.role === "STUDENT"
            ? {
                monthlyFee: form.monthlyFee === "" ? null : form.monthlyFee,
                studyTypes: form.studyTypes,
                lessonModes: form.lessonModes,
                studentKind: form.studentKind,
                studyStatus: form.studyStatus,
              }
            : {}),
        };
      }

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to update account");
        return;
      }
      onSaved?.();
      onClose();
    } catch {
      setError("Failed to update account");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
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
              <UserIcon className="w-5 h-5" style={{ color: ACCENT }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Edit Account</h2>
              <p className="text-sm text-gray-500">Update any account information</p>
            </div>
          </div>
          <button
            onClick={() => !saving && onClose()}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading account…
            </div>
          ) : (
            <>
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
                  />
                </Field>
                <Field label="Last name" required>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Email" required>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    className={inputCls}
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
                <Field label="Branch">
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
                <Field label="New password (optional)">
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="Leave blank to keep current"
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </Field>
              </div>

              {showProfileFields && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    {form.role === "STUDENT" ? "Student" : "Teacher"} details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Phone number">
                      <input
                        type="tel"
                        value={form.phoneNumber}
                        onChange={(e) => set("phoneNumber", e.target.value)}
                        className={inputCls}
                        placeholder="+994 XX XXX XX XX"
                      />
                    </Field>
                    <Field label="Date of birth">
                      <input
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(e) => set("dateOfBirth", e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                    {form.role === "STUDENT" && (
                      <Field label="Monthly fee (AZN)">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.monthlyFee}
                          onChange={(e) => set("monthlyFee", e.target.value)}
                          className={inputCls}
                          placeholder="0.00"
                        />
                      </Field>
                    )}
                    {form.role === "STUDENT" && (
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
                    )}
                    {form.role === "STUDENT" && (
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
                    )}
                  </div>

                  {form.role === "STUDENT" && (
                    <>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Study types{" "}
                          <span className="text-gray-400 font-normal">(choose one or more)</span>
                        </label>
                        <ToggleChips
                          options={STUDY_TYPES.map((t) => ({
                            id: t.id,
                            label: t.label,
                            accent: t.accent,
                          }))}
                          selected={form.studyTypes}
                          onToggle={(id) => toggleIn("studyTypes", id)}
                        />
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lesson modes{" "}
                          <span className="text-gray-400 font-normal">(choose one or more)</span>
                        </label>
                        <ToggleChips
                          options={LESSON_MODES.map((m) => ({ id: m.id, label: m.label }))}
                          selected={form.lessonModes}
                          onToggle={(id) => toggleIn("lessonModes", id)}
                        />
                      </div>

                      <div className="mt-5 rounded-lg border border-amber-100 bg-amber-50/60 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                              <Coins className="w-4 h-4 text-amber-600" />
                              Coin balance
                            </p>
                            <p className="text-2xl font-bold text-amber-700 mt-1">
                              {coinBalance}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowCoinModal(true)}
                            className="px-3 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700"
                          >
                            Add Coins
                          </button>
                        </div>
                      </div>

                      {userId && (
                        <div className="mt-5">
                          <CoinStudentHistoryPanel
                            studentId={userId}
                            refreshToken={coinHistoryRefresh}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="mt-5 flex items-center gap-2">
                <input
                  id="edit-approved"
                  type="checkbox"
                  checked={form.approved}
                  onChange={(e) => set("approved", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="edit-approved" className="text-sm font-medium text-gray-700">
                  Approved (can access their dashboard)
                </label>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={() => !saving && onClose()}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ backgroundColor: ACCENT }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = "#252a6b";
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = ACCENT;
            }}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {userId && form.role === "STUDENT" && (
        <ManualCoinModal
          open={showCoinModal}
          studentId={userId}
          studentName={
            [form.firstName, form.lastName].filter(Boolean).join(" ").trim() ||
            form.email ||
            "Student"
          }
          initialBalance={coinBalance}
          onClose={() => setShowCoinModal(false)}
          onSuccess={(balance) => {
            setCoinBalance(balance);
            setCoinHistoryRefresh((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#303380]/30 focus:border-[#303380]";

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

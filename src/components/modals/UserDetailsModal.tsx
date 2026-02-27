"use client";

import { useState } from "react";
import {
  X, Edit2, Check, ChevronDown, Building2, Calendar, Clock,
  GraduationCap, BookOpen, Users, CreditCard, Award, Target,
  Shield, Briefcase, Key, UserCheck, UserX, BarChart3,
  TrendingUp, FileText, Star, Layers
} from "lucide-react";

interface UserDetailsModalProps {
  userDetails: any;
  branches: any[];
  approving: string | null;
  updating: boolean;
  onClose: () => void;
  onApprove: (userId: string, approved: boolean) => void;
  onUpdateUser: (newRole: string, newBranchId: string) => void;
  onResetPassword: () => void;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; light: string; icon: any }> = {
  STUDENT:      { label: "Student",      color: "text-blue-700",   bg: "bg-blue-600",    light: "bg-blue-50 text-blue-700 border-blue-200",   icon: GraduationCap },
  TEACHER:      { label: "Teacher",      color: "text-emerald-700",bg: "bg-emerald-600", light: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: BookOpen },
  ADMIN:        { label: "Admin",        color: "text-violet-700", bg: "bg-violet-600",  light: "bg-violet-50 text-violet-700 border-violet-200",  icon: Shield },
  BOSS:         { label: "Boss",         color: "text-red-700",    bg: "bg-red-600",     light: "bg-red-50 text-red-700 border-red-200",     icon: Star },
  BRANCH_ADMIN: { label: "Branch Admin", color: "text-orange-700", bg: "bg-orange-500",  light: "bg-orange-50 text-orange-700 border-orange-200", icon: Building2 },
  BRANCH_BOSS:  { label: "Branch Boss",  color: "text-pink-700",   bg: "bg-pink-500",    light: "bg-pink-50 text-pink-700 border-pink-200",   icon: Star },
  CREATOR:      { label: "Creator",      color: "text-gray-700",   bg: "bg-gray-700",    light: "bg-gray-100 text-gray-700 border-gray-300",  icon: Layers },
};

function initials(name: string) {
  return (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function fmt(date: string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent: string }) {
  return (
    <div className="flex flex-col gap-1 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? 0}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{children}</h5>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <div className="text-sm text-gray-900 text-right">{children}</div>
    </div>
  );
}

// ─── Student layout ──────────────────────────────────────────────────────────
function StudentLayout({ u, editing, setEditing, newRole, setNewRole, newBranchId, setNewBranchId, branches, onSave, onCancel, saving, onApprove, approving, onResetPassword }: any) {
  const cfg = ROLE_CONFIG["STUDENT"];
  return (
    <div className="flex flex-col gap-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={BookOpen}     label="Attempts"         value={u._count?.attempts ?? 0}           accent="bg-blue-100 text-blue-600" />
        <StatCard icon={Users}        label="Classes"          value={u._count?.classEnrollments ?? 0}   accent="bg-indigo-100 text-indigo-600" />
        <StatCard icon={FileText}     label="Enrollments"      value={u._count?.enrollments ?? 0}        accent="bg-purple-100 text-purple-600" />
        <StatCard icon={CreditCard}   label="Payments"         value={u._count?.payments ?? 0}           accent="bg-emerald-100 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account details */}
        <div className="bg-gray-50 rounded-xl p-5">
          <SectionHeader>Account Details</SectionHeader>
          <div className="space-y-0">
            <InfoRow label="User ID">
              <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-gray-200">{u.id.slice(-10)}</span>
            </InfoRow>
            <InfoRow label="Status">
              {u.approved
                ? <span className="inline-flex items-center gap-1 text-emerald-600 font-medium"><UserCheck className="w-3.5 h-3.5" /> Approved</span>
                : <span className="inline-flex items-center gap-1 text-amber-600 font-medium"><UserX className="w-3.5 h-3.5" /> Pending</span>}
            </InfoRow>
            <InfoRow label="Branch">
              {editing === "branch" ? (
                <select value={newBranchId} onChange={(e) => setNewBranchId(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400">
                  <option value="">No Branch</option>
                  {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              ) : (
                <span className="flex items-center gap-1">{u.branch?.name || "—"}
                  <button onClick={() => setEditing("branch")} className="p-0.5 text-gray-300 hover:text-gray-500"><Edit2 className="w-3 h-3" /></button>
                </span>
              )}
            </InfoRow>
            <InfoRow label="Role">
              {editing === "role" ? (
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-400">
                  {Object.entries(ROLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              ) : (
                <span className="flex items-center gap-1">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${cfg.light}`}>{ROLE_CONFIG[u.role]?.label ?? u.role}</span>
                  <button onClick={() => setEditing("role")} className="p-0.5 text-gray-300 hover:text-gray-500"><Edit2 className="w-3 h-3" /></button>
                </span>
              )}
            </InfoRow>
            <InfoRow label="Joined">{fmt(u.createdAt)}</InfoRow>
            <InfoRow label="Last Updated">{fmt(u.updatedAt)}</InfoRow>
          </div>
          {editing && (
            <div className="flex gap-2 mt-4">
              <button onClick={onSave} disabled={saving}
                className="flex-1 py-1.5 text-xs font-medium text-white rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition">
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={onCancel}
                className="flex-1 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Student profile */}
        <div className="bg-gray-50 rounded-xl p-5">
          <SectionHeader>Student Profile</SectionHeader>
          {u.studentProfile ? (
            <div className="space-y-0">
              <InfoRow label="First Enrolled">{fmt(u.studentProfile.firstEnrollAt)}</InfoRow>
              <InfoRow label="Monthly Fee">
                {u.studentProfile.monthlyFee ? `${u.studentProfile.monthlyFee} AZN` : "—"}
              </InfoRow>
              <InfoRow label="Teacher">
                {u.studentProfile.teacher
                  ? <span>{u.studentProfile.teacher.name}<br /><span className="text-xs text-gray-400">{u.studentProfile.teacher.email}</span></span>
                  : "—"}
              </InfoRow>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No student profile found.</p>
          )}

          {/* Enrollments */}
          {u.enrollments?.length > 0 && (
            <div className="mt-5">
              <SectionHeader>Course Enrollments</SectionHeader>
              <div className="space-y-2">
                {u.enrollments.map((en: any) => (
                  <div key={en.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{en.courseName}</p>
                      <p className="text-xs text-gray-400">{en.courseType}{en.level ? ` · ${en.level}` : ""}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      en.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                    }`}>{en.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attempts */}
      {u.attempts?.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-5">
          <SectionHeader>Recent Exam Attempts</SectionHeader>
          <div className="space-y-2">
            {u.attempts.map((att: any) => (
              <div key={att.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{att.exam?.title ?? att.examId}</p>
                  <p className="text-xs text-gray-400">
                    {att.submittedAt ? `Submitted ${fmt(att.submittedAt)}` : att.startedAt ? `Started ${fmt(att.startedAt)}` : fmt(att.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {att.bandOverall != null && (
                    <span className="text-base font-bold text-blue-700">{att.bandOverall}</span>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    att.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700"
                    : att.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-500"
                  }`}>{att.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classes */}
      {u.classEnrollments?.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-5">
          <SectionHeader>Class Memberships</SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {u.classEnrollments.map((ce: any) => (
              <div key={ce.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{ce.class.name}</p>
                  <p className="text-xs text-gray-400">Enrolled {fmt(ce.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payments */}
      {(u.payments?.length > 0 || u.tuitionPayments?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {u.payments?.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-5">
              <SectionHeader>Payment Schedule</SectionHeader>
              <div className="space-y-2">
                {u.payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.amount} AZN</p>
                      <p className="text-xs text-gray-400">Due {fmt(p.dueDate)}{p.paidDate ? ` · Paid ${fmt(p.paidDate)}` : ""}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                    }`}>{p.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {u.tuitionPayments?.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-5">
              <SectionHeader>Tuition Payments</SectionHeader>
              <div className="space-y-2">
                {u.tuitionPayments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(p.year, p.month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </p>
                      <p className="text-xs text-gray-400">{p.amount} AZN{p.paidAt ? ` · Paid ${fmt(p.paidAt)}` : ""}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                    }`}>{p.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Teacher layout ───────────────────────────────────────────────────────────
function TeacherLayout({ u, editing, setEditing, newRole, setNewRole, newBranchId, setNewBranchId, branches, onSave, onCancel, saving }: any) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Users}      label="Classes Teaching" value={u._count?.classesTeaching ?? 0} accent="bg-emerald-100 text-emerald-600" />
        <StatCard icon={BookOpen}   label="Exams Created"    value={u._count?.examsCreated ?? 0}    accent="bg-blue-100 text-blue-600" />
        <StatCard icon={Target}     label="Assignments"      value={u.assignmentsAsTeacher?.length ?? 0} accent="bg-purple-100 text-purple-600" />
        <StatCard icon={GraduationCap} label="Students"     value={u.studentsTeaching?.length ?? 0} accent="bg-amber-100 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-xl p-5">
          <SectionHeader>Account Details</SectionHeader>
          <div className="space-y-0">
            <InfoRow label="User ID">
              <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-gray-200">{u.id.slice(-10)}</span>
            </InfoRow>
            <InfoRow label="Status">
              {u.approved
                ? <span className="inline-flex items-center gap-1 text-emerald-600 font-medium"><UserCheck className="w-3.5 h-3.5" /> Approved</span>
                : <span className="inline-flex items-center gap-1 text-amber-600 font-medium"><UserX className="w-3.5 h-3.5" /> Pending</span>}
            </InfoRow>
            <InfoRow label="Branch">
              {editing === "branch" ? (
                <select value={newBranchId} onChange={(e) => setNewBranchId(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none">
                  <option value="">No Branch</option>
                  {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              ) : (
                <span className="flex items-center gap-1">{u.branch?.name || "—"}
                  <button onClick={() => setEditing("branch")} className="p-0.5 text-gray-300 hover:text-gray-500"><Edit2 className="w-3 h-3" /></button>
                </span>
              )}
            </InfoRow>
            <InfoRow label="Role">
              {editing === "role" ? (
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none">
                  {Object.entries(ROLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              ) : (
                <span className="flex items-center gap-1">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${ROLE_CONFIG[u.role]?.light}`}>{ROLE_CONFIG[u.role]?.label ?? u.role}</span>
                  <button onClick={() => setEditing("role")} className="p-0.5 text-gray-300 hover:text-gray-500"><Edit2 className="w-3 h-3" /></button>
                </span>
              )}
            </InfoRow>
            <InfoRow label="Joined">{fmt(u.createdAt)}</InfoRow>
          </div>
          {editing && (
            <div className="flex gap-2 mt-4">
              <button onClick={onSave} disabled={saving}
                className="flex-1 py-1.5 text-xs font-medium text-white rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition">
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={onCancel}
                className="flex-1 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Classes Teaching */}
        <div className="bg-gray-50 rounded-xl p-5">
          <SectionHeader>Classes Teaching</SectionHeader>
          {u.classesTeaching?.length > 0 ? (
            <div className="space-y-2">
              {u.classesTeaching.map((cls: any) => (
                <div key={cls.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">{cls.name}</p>
                  </div>
                  <span className="text-xs text-gray-500">{cls._count?.classStudents ?? 0} students</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400 italic">No classes yet.</p>}
        </div>
      </div>

      {/* Exams Created */}
      {u.examsCreated?.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-5">
          <SectionHeader>Exams Created</SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {u.examsCreated.map((ex: any) => (
              <div key={ex.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{ex.title}</p>
                  <p className="text-xs text-gray-400">{ex.category} · {fmt(ex.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Assignments */}
      {u.assignmentsAsTeacher?.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-5">
          <SectionHeader>Recent Assignments (as Teacher)</SectionHeader>
          <div className="space-y-2">
            {u.assignmentsAsTeacher.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.unitExam?.exam?.title ?? "—"}</p>
                  <p className="text-xs text-gray-400">→ {a.student?.name} ({a.student?.email})</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  a.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                }`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin/Boss/Staff layout ──────────────────────────────────────────────────
function AdminLayout({ u, editing, setEditing, newRole, setNewRole, newBranchId, setNewBranchId, branches, onSave, onCancel, saving }: any) {
  const cfg = ROLE_CONFIG[u.role] ?? ROLE_CONFIG["ADMIN"];
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard icon={BarChart3}  label="Total Actions"  value="—"                               accent="bg-violet-100 text-violet-600" />
        <StatCard icon={BookOpen}   label="Exams Created"  value={u._count?.examsCreated ?? 0}      accent="bg-blue-100 text-blue-600" />
        <StatCard icon={Users}      label="Classes"        value={u._count?.classesTeaching ?? 0}   accent="bg-indigo-100 text-indigo-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-xl p-5">
          <SectionHeader>Account Details</SectionHeader>
          <div className="space-y-0">
            <InfoRow label="User ID">
              <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-gray-200">{u.id.slice(-10)}</span>
            </InfoRow>
            <InfoRow label="Status">
              {u.approved
                ? <span className="inline-flex items-center gap-1 text-emerald-600 font-medium"><UserCheck className="w-3.5 h-3.5" /> Approved</span>
                : <span className="inline-flex items-center gap-1 text-amber-600 font-medium"><UserX className="w-3.5 h-3.5" /> Pending</span>}
            </InfoRow>
            <InfoRow label="Branch">
              {editing === "branch" ? (
                <select value={newBranchId} onChange={(e) => setNewBranchId(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none">
                  <option value="">No Branch</option>
                  {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              ) : (
                <span className="flex items-center gap-1">{u.branch?.name || "—"}
                  <button onClick={() => setEditing("branch")} className="p-0.5 text-gray-300 hover:text-gray-500"><Edit2 className="w-3 h-3" /></button>
                </span>
              )}
            </InfoRow>
            <InfoRow label="Role">
              {editing === "role" ? (
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none">
                  {Object.entries(ROLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              ) : (
                <span className="flex items-center gap-1">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${cfg.light}`}>{cfg.label}</span>
                  <button onClick={() => setEditing("role")} className="p-0.5 text-gray-300 hover:text-gray-500"><Edit2 className="w-3 h-3" /></button>
                </span>
              )}
            </InfoRow>
            <InfoRow label="Joined">{fmt(u.createdAt)}</InfoRow>
            <InfoRow label="Last Updated">{fmt(u.updatedAt)}</InfoRow>
          </div>
          {editing && (
            <div className="flex gap-2 mt-4">
              <button onClick={onSave} disabled={saving}
                className="flex-1 py-1.5 text-xs font-medium text-white rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition">
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={onCancel}
                className="flex-1 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl p-5">
          <SectionHeader>Permissions & Access</SectionHeader>
          <div className="space-y-2">
            {[
              { label: "Manage Users",   granted: ["ADMIN","BOSS","CREATOR","BRANCH_ADMIN","BRANCH_BOSS"].includes(u.role) },
              { label: "Manage Exams",   granted: ["ADMIN","BOSS","CREATOR","TEACHER"].includes(u.role) },
              { label: "View Reports",   granted: ["ADMIN","BOSS","CREATOR"].includes(u.role) },
              { label: "System Config",  granted: ["CREATOR","BOSS"].includes(u.role) },
            ].map((perm) => (
              <div key={perm.label} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                <span className="text-sm text-gray-700">{perm.label}</span>
                {perm.granted
                  ? <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><Check className="w-3.5 h-3.5" /> Granted</span>
                  : <span className="text-xs text-gray-400">Restricted</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {u.examsCreated?.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-5">
          <SectionHeader>Exams Created</SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {u.examsCreated.map((ex: any) => (
              <div key={ex.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{ex.title}</p>
                  <p className="text-xs text-gray-400">{ex.category} · {fmt(ex.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export function UserDetailsModal({
  userDetails: u,
  branches,
  approving,
  updating,
  onClose,
  onApprove,
  onUpdateUser,
  onResetPassword,
}: UserDetailsModalProps) {
  const [editing, setEditing] = useState<"role" | "branch" | null>(null);
  const [newRole, setNewRole] = useState(u.role);
  const [newBranchId, setNewBranchId] = useState(u.branchId || "");

  const cfg = ROLE_CONFIG[u.role] ?? ROLE_CONFIG["ADMIN"];
  const RoleIcon = cfg.icon;

  const handleSave = () => onUpdateUser(newRole, newBranchId);
  const handleCancel = () => {
    setEditing(null);
    setNewRole(u.role);
    setNewBranchId(u.branchId || "");
  };

  const sharedProps = {
    u, editing, setEditing, newRole, setNewRole,
    newBranchId, setNewBranchId, branches,
    onSave: handleSave, onCancel: handleCancel, saving: updating,
    onApprove, approving, onResetPassword,
  };

  const isStudent = u.role === "STUDENT";
  const isTeacher = u.role === "TEACHER";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* ── Header ── */}
        <div className={`${cfg.bg} px-6 py-5`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-white">{initials(u.name || u.email)}</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white leading-tight">{u.name || "—"}</h3>
                <p className="text-white/80 text-sm mt-0.5">{u.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-white/20 text-white">
                    <RoleIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                  {u.approved ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-400/30 text-white">
                      <UserCheck className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-400/30 text-white">
                      <UserX className="w-3 h-3" /> Pending
                    </span>
                  )}
                  {u.branch?.name && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-white/15 text-white">
                      <Building2 className="w-3 h-3" /> {u.branch.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {isStudent && <StudentLayout {...sharedProps} />}
          {isTeacher && <TeacherLayout {...sharedProps} />}
          {!isStudent && !isTeacher && <AdminLayout {...sharedProps} />}
        </div>

        {/* ── Footer ── */}
        {!editing && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap items-center gap-3 bg-gray-50">
            <button
              onClick={() => onApprove(u.id, !u.approved)}
              disabled={approving === u.id}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition disabled:opacity-50 ${
                u.approved
                  ? "border border-red-200 text-red-600 hover:bg-red-50"
                  : "border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              }`}
            >
              {approving === u.id ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : u.approved ? (
                <UserX className="w-3.5 h-3.5" />
              ) : (
                <UserCheck className="w-3.5 h-3.5" />
              )}
              {approving === u.id ? "Updating…" : u.approved ? "Disapprove" : "Approve"}
            </button>
            <button
              onClick={onResetPassword}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl transition"
              style={{ backgroundColor: "#303380" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#252a6b"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#303380"; }}
            >
              <Key className="w-3.5 h-3.5" />
              Reset Password
            </button>
            <span className="ml-auto text-xs text-gray-400">ID: {u.id}</span>
          </div>
        )}
      </div>
    </div>
  );
}

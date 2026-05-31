"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, X, Clock, CheckCircle, XCircle } from "lucide-react";
import { AlertModal } from "@/components/modals/AlertModal";

type Branch = { id: string; name: string };

type ReferralRow = {
  id: string;
  studentName: string;
  studentEmail: string | null;
  studentPhone: string | null;
  program: string | null;
  notes: string | null;
  status: string;
  monthlyPrice: number | null;
  commissionTiers: unknown;
  decisionNotes: string | null;
  createdAt: string;
  branch: Branch;
};

const statusBadge: Record<string, string> = {
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  ACCEPTED: "bg-green-100 text-green-800",
  DECLINED: "bg-red-100 text-red-800",
};

const statusLabel: Record<string, string> = {
  IN_PROGRESS: "In progress",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
};

export default function PartnerReferralsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [alert, setAlert] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
  });
  const [form, setForm] = useState({
    branchId: "",
    studentFirstName: "",
    studentLastName: "",
    studentEmail: "",
    studentPhone: "",
    program: "",
    notes: "",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/login");
      return;
    }
    if ((session.user as { role?: string }).role !== "PARTNER") {
      router.push("/dashboard");
      return;
    }
    load();
  }, [session, status, router]);

  async function load() {
    setLoading(true);
    try {
      const [refRes, branchRes] = await Promise.all([
        fetch("/api/partner/referrals"),
        fetch("/api/branches"),
      ]);
      const refData = await refRes.json();
      const branchData = await branchRes.json();
      if (refRes.ok) setReferrals(refData.referrals ?? []);
      if (branchRes.ok) setBranches(branchData.branches ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.branchId || !form.studentFirstName.trim()) {
      setFormError("Branch and student first name are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/partner/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to submit referral");
        return;
      }
      setShowModal(false);
      setForm({
        branchId: "",
        studentFirstName: "",
        studentLastName: "",
        studentEmail: "",
        studentPhone: "",
        program: "",
        notes: "",
      });
      setAlert({
        isOpen: true,
        title: "Referral submitted",
        message: "The branch will review your referral and contact the student.",
        type: "success",
      });
      await load();
    } catch {
      setFormError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-gray-900">Referrals</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Refer students to a branch and track their status
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md"
          style={{ backgroundColor: "#303380" }}
        >
          <Plus className="w-4 h-4" />
          Refer a student
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500">Loading...</div>
      ) : referrals.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-md p-12 text-center text-gray-500">
          No referrals yet. Click &quot;Refer a student&quot; to get started.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Student</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Branch</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Program</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {referrals.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{r.studentName}</div>
                      {r.studentPhone && (
                        <div className="text-xs text-gray-500">{r.studentPhone}</div>
                      )}
                      {r.studentEmail && (
                        <div className="text-xs text-gray-500">{r.studentEmail}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.branch.name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.program || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                          statusBadge[r.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {r.status === "IN_PROGRESS" && <Clock className="w-3 h-3" />}
                        {r.status === "ACCEPTED" && <CheckCircle className="w-3 h-3" />}
                        {r.status === "DECLINED" && <XCircle className="w-3 h-3" />}
                        {statusLabel[r.status] ?? r.status}
                      </span>
                      {r.status === "ACCEPTED" && r.monthlyPrice != null && (
                        <div className="text-xs text-gray-500 mt-1">
                          {r.monthlyPrice} AZN / month
                        </div>
                      )}
                      {r.status === "DECLINED" && r.decisionNotes && (
                        <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                          {r.decisionNotes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">Refer a student</h2>
              <button type="button" onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{formError}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch *
                </label>
                <select
                  required
                  value={form.branchId}
                  onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                >
                  <option value="">Select branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First name *
                  </label>
                  <input
                    required
                    value={form.studentFirstName}
                    onChange={(e) =>
                      setForm({ ...form, studentFirstName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last name
                  </label>
                  <input
                    value={form.studentLastName}
                    onChange={(e) =>
                      setForm({ ...form, studentLastName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.studentEmail}
                  onChange={(e) => setForm({ ...form, studentEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  value={form.studentPhone}
                  onChange={(e) => setForm({ ...form, studentPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <input
                  value={form.program}
                  onChange={(e) => setForm({ ...form, program: e.target.value })}
                  placeholder="e.g. IELTS, General English"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-sm bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 text-sm text-white rounded-md disabled:opacity-50"
                  style={{ backgroundColor: "#303380" }}
                >
                  {submitting ? "Submitting..." : "Submit referral"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={alert.isOpen}
        onClose={() => setAlert((a) => ({ ...a, isOpen: false }))}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />
    </div>
  );
}

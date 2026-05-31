"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { X, Search, Plus, Trash2 } from "lucide-react";
import { AlertModal } from "@/components/modals/AlertModal";

type CommissionTier = { fromMonth: number; toMonth: number | null; percent: number };

type ReferralRow = {
  id: string;
  studentName: string;
  studentFirstName: string;
  studentLastName: string | null;
  studentEmail: string | null;
  studentPhone: string | null;
  program: string | null;
  notes: string | null;
  status: string;
  monthlyPrice: number | null;
  commissionTiers: CommissionTier[] | null;
  branch: { id: string; name: string };
  partner: { id: string; firstName: string | null; lastName: string | null; email: string };
};

type StudentOption = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
};

const statusBadge: Record<string, string> = {
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  ACCEPTED: "bg-green-100 text-green-800",
  DECLINED: "bg-red-100 text-red-800",
};

export default function ReferralsManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [filter, setFilter] = useState("IN_PROGRESS");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReferralRow | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [formError, setFormError] = useState("");
  const [linkMode, setLinkMode] = useState<"link" | "create">("link");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState<StudentOption[]>([]);
  const [linkStudentId, setLinkStudentId] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [tiers, setTiers] = useState<CommissionTier[]>([
    { fromMonth: 1, toMonth: 1, percent: 25 },
    { fromMonth: 2, toMonth: null, percent: 10 },
  ]);
  const [createStudent, setCreateStudent] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    program: "",
  });
  const [decisionNotes, setDecisionNotes] = useState("");
  const [alert, setAlert] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== "ALL" ? `?status=${filter}` : "";
      const res = await fetch(`/api/referrals${params}`);
      const data = await res.json();
      if (res.ok) setReferrals(data.referrals ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/login");
      return;
    }
    const role = (session.user as { role?: string }).role;
    const allowed = ["BOSS", "ADMIN", "BRANCH_ADMIN", "BRANCH_BOSS", "CREATOR"];
    if (!role || !allowed.includes(role)) {
      router.push("/dashboard");
      return;
    }
    load();
  }, [session, status, router, load]);

  useEffect(() => {
    if (!selected || linkMode !== "link") return;
    const q = studentSearch.trim();
    if (q.length < 2) {
      setStudentResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const params = new URLSearchParams({ q, branchId: selected.branch.id });
      const res = await fetch(`/api/referrals/students-search?${params}`);
      const data = await res.json();
      if (res.ok) setStudentResults(data.students ?? []);
    }, 300);
    return () => clearTimeout(t);
  }, [studentSearch, selected, linkMode]);

  function openDecide(r: ReferralRow) {
    setSelected(r);
    setFormError("");
    setLinkMode("link");
    setLinkStudentId("");
    setStudentSearch("");
    setMonthlyPrice("");
    setTiers([
      { fromMonth: 1, toMonth: 1, percent: 25 },
      { fromMonth: 2, toMonth: null, percent: 10 },
    ]);
    setCreateStudent({
      email: r.studentEmail ?? "",
      password: "",
      firstName: r.studentFirstName,
      lastName: r.studentLastName ?? "",
      phoneNumber: r.studentPhone ?? "",
      program: r.program ?? "",
    });
    setDecisionNotes("");
  }

  function addTier() {
    const last = tiers[tiers.length - 1];
    const nextFrom = last?.toMonth ? last.toMonth + 1 : (last?.fromMonth ?? 0) + 1;
    setTiers([...tiers, { fromMonth: nextFrom, toMonth: null, percent: 5 }]);
  }

  function removeTier(i: number) {
    if (tiers.length <= 1) return;
    setTiers(tiers.filter((_, idx) => idx !== i));
  }

  async function handleDecline() {
    if (!selected) return;
    setDeciding(true);
    setFormError("");
    try {
      const res = await fetch(`/api/referrals/${selected.id}/decide`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline", decisionNotes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed");
        return;
      }
      setSelected(null);
      setAlert({ isOpen: true, title: "Declined", message: "Referral marked as declined.", type: "success" });
      await load();
    } catch {
      setFormError("Something went wrong");
    } finally {
      setDeciding(false);
    }
  }

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const price = parseFloat(monthlyPrice);
    if (!Number.isFinite(price) || price <= 0) {
      setFormError("Enter a valid monthly price");
      return;
    }
    setDeciding(true);
    setFormError("");
    try {
      const payload: Record<string, unknown> = {
        action: "accept",
        monthlyPrice: price,
        commissionTiers: tiers,
        decisionNotes,
      };
      if (linkMode === "link") {
        if (!linkStudentId) {
          setFormError("Select a student to link");
          setDeciding(false);
          return;
        }
        payload.linkStudentId = linkStudentId;
      } else {
        if (!createStudent.email || !createStudent.password || !createStudent.firstName) {
          setFormError("Email, password, and first name are required for new student");
          setDeciding(false);
          return;
        }
        payload.createStudent = createStudent;
      }
      const res = await fetch(`/api/referrals/${selected.id}/decide`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed");
        return;
      }
      setSelected(null);
      setAlert({ isOpen: true, title: "Accepted", message: "Referral accepted and student linked.", type: "success" });
      await load();
    } catch {
      setFormError("Something went wrong");
    } finally {
      setDeciding(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-medium text-gray-900">Partner referrals</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Review referrals from partners, contact students, and set commission terms
        </p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(["IN_PROGRESS", "ACCEPTED", "DECLINED", "ALL"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-md border ${
              filter === s
                ? "bg-[#303380] text-white border-[#303380]"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            {s === "ALL" ? "All" : s.replace("_", " ").toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3">Student</th>
                  <th className="text-left px-4 py-3">Partner</th>
                  <th className="text-left px-4 py-3">Branch</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {referrals.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.studentName}</div>
                      <div className="text-xs text-gray-500">{r.studentPhone}</div>
                      <div className="text-xs text-gray-500">{r.program}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {[r.partner.firstName, r.partner.lastName].filter(Boolean).join(" ") ||
                        r.partner.email}
                    </td>
                    <td className="px-4 py-3">{r.branch.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          statusBadge[r.status] ?? ""
                        }`}
                      >
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "IN_PROGRESS" && (
                        <button
                          type="button"
                          onClick={() => openDecide(r)}
                          className="text-sm text-[#303380] font-medium hover:underline"
                        >
                          Review
                        </button>
                      )}
                      {r.status === "ACCEPTED" && r.monthlyPrice != null && (
                        <span className="text-xs text-gray-600">
                          {r.monthlyPrice} AZN/mo
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {referrals.length === 0 && (
              <p className="p-8 text-center text-gray-500">No referrals in this filter</p>
            )}
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-medium">Review: {selected.studentName}</h2>
              <button type="button" onClick={() => setSelected(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <p>
                  <strong>Partner:</strong> {selected.partner.email}
                </p>
                <p>
                  <strong>Branch:</strong> {selected.branch.name}
                </p>
                {selected.notes && (
                  <p className="mt-1">
                    <strong>Notes:</strong> {selected.notes}
                  </p>
                )}
              </div>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{formError}</p>
              )}

              <form onSubmit={handleAccept} className="space-y-4 border-t pt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Monthly tuition price (AZN) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Commission tiers *</label>
                    <button
                      type="button"
                      onClick={addTier}
                      className="text-xs text-[#303380] flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add tier
                    </button>
                  </div>
                  <div className="space-y-2">
                    {tiers.map((tier, i) => (
                      <div key={i} className="flex gap-2 items-center flex-wrap">
                        <span className="text-xs text-gray-500">Month</span>
                        <input
                          type="number"
                          min={1}
                          value={tier.fromMonth}
                          onChange={(e) => {
                            const next = [...tiers];
                            next[i] = { ...tier, fromMonth: Number(e.target.value) };
                            setTiers(next);
                          }}
                          className="w-16 px-2 py-1 border rounded text-sm"
                        />
                        <span className="text-xs text-gray-500">to</span>
                        <input
                          type="number"
                          min={tier.fromMonth}
                          placeholder="∞"
                          value={tier.toMonth ?? ""}
                          onChange={(e) => {
                            const next = [...tiers];
                            next[i] = {
                              ...tier,
                              toMonth: e.target.value ? Number(e.target.value) : null,
                            };
                            setTiers(next);
                          }}
                          className="w-16 px-2 py-1 border rounded text-sm"
                        />
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={tier.percent}
                          onChange={(e) => {
                            const next = [...tiers];
                            next[i] = { ...tier, percent: Number(e.target.value) };
                            setTiers(next);
                          }}
                          className="w-16 px-2 py-1 border rounded text-sm"
                        />
                        <span className="text-xs">%</span>
                        <button type="button" onClick={() => removeTier(i)}>
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Example: months 1–1 at 25%, month 2+ at 10%
                  </p>
                </div>

                <div className="flex gap-4 border-t pt-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={linkMode === "link"}
                      onChange={() => setLinkMode("link")}
                    />
                    Link existing student
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={linkMode === "create"}
                      onChange={() => setLinkMode("create")}
                    />
                    Create new student
                  </label>
                </div>

                {linkMode === "link" ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">Search student</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
                        placeholder="Name or email"
                      />
                    </div>
                    {studentResults.length > 0 && (
                      <ul className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                        {studentResults.map((s) => (
                          <li key={s.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setLinkStudentId(s.id);
                                setStudentSearch(
                                  `${s.firstName ?? ""} ${s.lastName ?? ""} (${s.email})`.trim()
                                );
                                setStudentResults([]);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                                linkStudentId === s.id ? "bg-blue-50" : ""
                              }`}
                            >
                              {[s.firstName, s.lastName].filter(Boolean).join(" ")} — {s.email}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder="First name *"
                      value={createStudent.firstName}
                      onChange={(e) =>
                        setCreateStudent({ ...createStudent, firstName: e.target.value })
                      }
                      className="px-3 py-2 border rounded-md text-sm"
                    />
                    <input
                      placeholder="Last name"
                      value={createStudent.lastName}
                      onChange={(e) =>
                        setCreateStudent({ ...createStudent, lastName: e.target.value })
                      }
                      className="px-3 py-2 border rounded-md text-sm"
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={createStudent.email}
                      onChange={(e) =>
                        setCreateStudent({ ...createStudent, email: e.target.value })
                      }
                      className="col-span-2 px-3 py-2 border rounded-md text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Password *"
                      value={createStudent.password}
                      onChange={(e) =>
                        setCreateStudent({ ...createStudent, password: e.target.value })
                      }
                      className="col-span-2 px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Internal notes</label>
                  <textarea
                    rows={2}
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    disabled={deciding}
                    onClick={handleDecline}
                    className="px-4 py-2 text-sm text-red-700 bg-red-50 rounded-md"
                  >
                    Decline
                  </button>
                  <button
                    type="submit"
                    disabled={deciding}
                    className="flex-1 px-4 py-2 text-sm text-white rounded-md disabled:opacity-50"
                    style={{ backgroundColor: "#303380" }}
                  >
                    {deciding ? "Saving..." : "Accept & save terms"}
                  </button>
                </div>
              </form>
            </div>
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

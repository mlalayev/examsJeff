"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  Phone,
  Mail,
  X,
  Users,
  Calendar,
  StickyNote,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AlertModal } from "@/components/modals/AlertModal";
import UnifiedLoading from "@/components/loading/UnifiedLoading";
import { CRM_CONTACT_REASONS, catalogLabel } from "@/lib/portal-catalog";
import {
  CRM_STATUS_OPTIONS,
  MONTH_NAMES,
  type CrmContactStatus,
} from "@/lib/crm";

type CrmContact = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  phoneNumber: string;
  contactReason: string;
  contactReasonLabel?: string;
  status: CrmContactStatus;
  email: string | null;
  dateOfBirth: string | null;
  notes: string | null;
  archivedAt: string | null;
  firstContactedAt: string;
  createdAt: string;
  createdBy: { id: string; name: string; email: string } | null;
};

type FormState = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  contactReason: string;
  status: CrmContactStatus;
  email: string;
  dateOfBirth: string;
  firstContactedAt: string;
  notes: string;
};

type StatusFilter = "ALL" | CrmContactStatus;
type ArchiveView = "active" | "archived";

type MonthSummary = { month: number; count: number };

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  contactReason: "",
  status: "WRITTEN",
  email: "",
  dateOfBirth: "",
  firstContactedAt: new Date().toISOString().slice(0, 10),
  notes: "",
};

function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

function statusLabel(value: CrmContactStatus) {
  return CRM_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function validateForm(form: FormState): string | null {
  if (!form.firstName.trim()) return "First name is required";
  if (!form.lastName.trim()) return "Last name is required";
  if (form.phoneNumber.trim().length < 7) {
    return "Mobile number is required (min 7 digits)";
  }
  if (!form.contactReason.trim()) {
    return "Contact interest / reason is required";
  }
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return "Invalid email";
  }
  return null;
}

export default function CrmPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [reasonFilter, setReasonFilter] = useState("ALL");
  const [archiveView, setArchiveView] = useState<ArchiveView>("active");
  const [filterYear, setFilterYear] = useState<number | "ALL">("ALL");
  const [filterMonth, setFilterMonth] = useState<number | "ALL">("ALL");
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());
  const [monthlySummary, setMonthlySummary] = useState<MonthSummary[]>([]);
  const [summaryTotal, setSummaryTotal] = useState(0);
  const [statusSavingId, setStatusSavingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CrmContact | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [alert, setAlert] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
  });

  const role = (session?.user as { role?: string } | undefined)?.role;
  const allowed = role === "ADMIN" || role === "BOSS" || role === "CREATOR";

  const loadSummary = useCallback(async (year: number) => {
    try {
      const res = await fetch(`/api/crm/contacts?summary=1&year=${year}`);
      const data = await res.json();
      if (res.ok) {
        setMonthlySummary(data.months ?? []);
        setSummaryTotal(data.total ?? 0);
      }
    } catch (e) {
      console.error("Load CRM summary:", e);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (reasonFilter !== "ALL") params.set("contactReason", reasonFilter);
      params.set("archive", archiveView);
      if (filterYear !== "ALL" && filterMonth !== "ALL") {
        params.set("year", String(filterYear));
        params.set("month", String(filterMonth));
      }

      const res = await fetch(`/api/crm/contacts?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error || "Failed to load contacts");
        setContacts([]);
        return;
      }
      setContacts(data.contacts ?? []);
    } catch (e) {
      console.error("Load CRM contacts:", e);
      setLoadError("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, reasonFilter, archiveView, filterYear, filterMonth]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated" && !allowed) {
      router.push("/auth/login?error=unauthorized");
      return;
    }
    if (status === "authenticated" && allowed) {
      load();
      loadSummary(summaryYear);
    }
  }, [status, allowed, load, loadSummary, summaryYear, router]);

  const stats = useMemo(
    () =>
      CRM_STATUS_OPTIONS.map((option) => ({
        ...option,
        count: contacts.filter((c) => c.status === option.value).length,
      })),
    [contacts]
  );

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => current - i);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      firstContactedAt: new Date().toISOString().slice(0, 10),
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (contact: CrmContact) => {
    setEditing(contact);
    setForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      phoneNumber: contact.phoneNumber,
      contactReason: contact.contactReason,
      status: contact.status,
      email: contact.email ?? "",
      dateOfBirth: toDateInput(contact.dateOfBirth),
      firstContactedAt: toDateInput(contact.firstContactedAt || contact.createdAt),
      notes: contact.notes ?? "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = (force = false) => {
    if (saving && !force) return;
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
  };

  const saveContact = async () => {
    const clientError = validateForm(form);
    if (clientError) {
      setFormError(clientError);
      return;
    }

    setFormError("");
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        contactReason: form.contactReason.trim(),
        status: form.status,
        email: form.email.trim(),
        dateOfBirth: form.dateOfBirth,
        firstContactedAt: form.firstContactedAt,
        notes: form.notes,
      };

      const res = await fetch(
        editing ? `/api/crm/contacts/${editing.id}` : "/api/crm/contacts",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to save contact");
        return;
      }

      const saved = data.contact as CrmContact | undefined;

      // After create: show active list so the new WRITTEN contact is visible
      if (!editing) {
        setArchiveView("active");
        setStatusFilter("ALL");
      }

      closeModal(true);

      if (saved && !editing && archiveView === "active") {
        setContacts((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)]);
      }

      await load();
      await loadSummary(summaryYear);

      setAlert({
        isOpen: true,
        title: "Success",
        message: editing ? "Contact updated" : "Contact added",
        type: "success",
      });
    } catch {
      setFormError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const updateContactStatus = async (
    contact: CrmContact,
    nextStatus: CrmContactStatus
  ) => {
    if (nextStatus === contact.status) return;
    setStatusSavingId(contact.id);
    try {
      const res = await fetch(`/api/crm/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({
          isOpen: true,
          title: "Error",
          message: data.error || "Failed to update stage",
          type: "error",
        });
        return;
      }
      await load();
    } catch {
      setAlert({
        isOpen: true,
        title: "Error",
        message: "Failed to update stage",
        type: "error",
      });
    } finally {
      setStatusSavingId(null);
    }
  };

  const setArchived = async (contact: CrmContact, archived: boolean) => {
    const verb = archived ? "Archive" : "Restore";
    if (
      !confirm(
        `${verb} ${contact.name}?\n\n${
          archived
            ? "They will move to Archive and keep their history."
            : "They will return to the active Contacts list."
        }`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/crm/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({
          isOpen: true,
          title: "Error",
          message: data.error || `Failed to ${verb.toLowerCase()}`,
          type: "error",
        });
        return;
      }
      await load();
      await loadSummary(summaryYear);
      setAlert({
        isOpen: true,
        title: "Success",
        message: archived ? "Contact archived" : "Contact restored",
        type: "success",
      });
    } catch {
      setAlert({
        isOpen: true,
        title: "Error",
        message: `Failed to ${verb.toLowerCase()} contact`,
        type: "error",
      });
    }
  };

  if (status === "loading" || (status === "authenticated" && !allowed)) {
    return <UnifiedLoading type="spinner" variant="spinner" size="md" />;
  }

  return (
    <div className="max-w-[100vw] overflow-x-hidden p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM Contacts</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track inquiries by interest, stage, and first-contact date.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#303380] px-4 py-2 text-sm font-medium text-white hover:bg-[#252a6b]"
        >
          <Plus className="h-4 w-4" />
          Add contact
        </button>
      </div>

      {/* Monthly inquiry summary */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-900">
            Monthly inquiries ({summaryYear})
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSummaryYear((y) => y - 1)}
              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
              title="Previous year"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <select
              value={summaryYear}
              onChange={(e) => setSummaryYear(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSummaryYear((y) => y + 1)}
              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
              title="Next year"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mb-2 text-xs text-gray-500">
          Total: <span className="font-medium text-gray-800">{summaryTotal}</span>{" "}
          (includes archived; based on When First Contacted)
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {MONTH_NAMES.map((name, idx) => {
            const count = monthlySummary.find((m) => m.month === idx + 1)?.count ?? 0;
            const selected =
              filterYear === summaryYear && filterMonth === idx + 1;
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setFilterYear(summaryYear);
                  setFilterMonth(idx + 1);
                }}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                  selected
                    ? "border-[#303380] bg-[#303380]/5"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200"
                }`}
              >
                <div className="text-xs text-gray-500">{name}</div>
                <div className="font-semibold text-gray-900">{count}</div>
              </button>
            );
          })}
        </div>
        {(filterYear !== "ALL" || filterMonth !== "ALL") && (
          <button
            type="button"
            onClick={() => {
              setFilterYear("ALL");
              setFilterMonth("ALL");
            }}
            className="mt-3 text-xs font-medium text-[#303380] hover:underline"
          >
            Clear month filter
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Showing:</span>
          <span className="font-medium text-gray-900">{contacts.length}</span>
        </div>
        {stats.map((stat) => (
          <div key={stat.value} className="flex items-center gap-2">
            <span className="text-gray-500">{stat.label}:</span>
            <span className="font-medium text-gray-900">{stat.count}</span>
          </div>
        ))}
      </div>

      {/* View tabs + filters */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="inline-flex w-fit rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => setArchiveView("active")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              archiveView === "active"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setArchiveView("archived")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              archiveView === "archived"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Archive
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search name, phone, email, interest, notes…"
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#303380] focus:ring-2 focus:ring-[#303380]/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#303380]"
          >
            <option value="ALL">All stages</option>
            {CRM_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#303380]"
          >
            <option value="ALL">All interests</option>
            {CRM_CONTACT_REASONS.map((item) => (
              <option key={item.id} value={item.label}>
                {item.label}
              </option>
            ))}
          </select>
          <button
            onClick={load}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Search
          </button>
        </div>
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">Loading…</div>
        ) : contacts.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p>
              {archiveView === "archived"
                ? "No archived contacts"
                : "No contacts yet"}
            </p>
            {archiveView === "active" && (
              <button
                onClick={openCreate}
                className="mt-3 text-sm font-medium text-[#303380] hover:underline"
              >
                Add your first contact
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Mobile
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Interest
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Stage
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    When First Contacted
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Notes
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                          {initials(contact.name)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {contact.name}
                          </div>
                          {contact.createdBy && (
                            <div className="text-xs text-gray-500">
                              by {contact.createdBy.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        {contact.phoneNumber}
                      </span>
                    </td>
                    <td className="max-w-[180px] px-4 py-3 text-gray-600">
                      {contact.contactReasonLabel ||
                        catalogLabel(contact.contactReason)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={contact.status}
                        disabled={statusSavingId === contact.id}
                        onChange={(e) =>
                          updateContactStatus(
                            contact,
                            e.target.value as CrmContactStatus
                          )
                        }
                        className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 outline-none focus:border-[#303380] disabled:opacity-50"
                        aria-label={`${contact.name} stage`}
                      >
                        {CRM_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {new Date(
                          contact.firstContactedAt || contact.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {contact.email ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          {contact.email}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-gray-500">
                      {contact.notes ? (
                        <span className="inline-flex items-center gap-1">
                          <StickyNote className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                          {contact.notes}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(contact)}
                          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {archiveView === "archived" ? (
                          <button
                            onClick={() => setArchived(contact, false)}
                            className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50"
                            title="Restore"
                          >
                            <ArchiveRestore className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setArchived(contact, true)}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-700"
                            title="Archive"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? "Edit contact" : "Add contact"}
              </h2>
              <button
                onClick={() => closeModal()}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField label="First name *">
                  <input
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Last name *">
                  <input
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                    className={inputClass}
                  />
                </FormField>
              </div>

              <FormField label="Mobile number *">
                <input
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm({ ...form, phoneNumber: e.target.value })
                  }
                  className={inputClass}
                  placeholder="+994 XX XXX XX XX"
                />
              </FormField>

              <FormField label="Contact interest / reason *">
                <select
                  value={form.contactReason}
                  onChange={(e) =>
                    setForm({ ...form, contactReason: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">What did they contact JEFF about?</option>
                  <optgroup label="Subjects / Lessons">
                    {CRM_CONTACT_REASONS.filter((i) => i.kind === "subject").map(
                      (item) => (
                        <option key={item.id} value={item.label}>
                          {item.label}
                        </option>
                      )
                    )}
                  </optgroup>
                  <optgroup label="Services">
                    {CRM_CONTACT_REASONS.filter((i) => i.kind === "service").map(
                      (item) => (
                        <option key={item.id} value={item.label}>
                          {item.label}
                        </option>
                      )
                    )}
                  </optgroup>
                  {form.contactReason &&
                  !CRM_CONTACT_REASONS.some(
                    (item) =>
                      item.label === form.contactReason ||
                      item.id === form.contactReason
                  ) ? (
                    <option value={form.contactReason}>
                      {catalogLabel(form.contactReason)}
                    </option>
                  ) : null}
                </select>
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Stage">
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as CrmContactStatus,
                      })
                    }
                    className={inputClass}
                  >
                    {CRM_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="When First Contacted *">
                  <input
                    type="date"
                    value={form.firstContactedAt}
                    onChange={(e) =>
                      setForm({ ...form, firstContactedAt: e.target.value })
                    }
                    className={inputClass}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Email address">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Date of birth">
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) =>
                      setForm({ ...form, dateOfBirth: e.target.value })
                    }
                    className={inputClass}
                  />
                </FormField>
              </div>

              <FormField label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className={inputClass}
                  placeholder="Follow-up details..."
                />
              </FormField>

              {editing && (
                <p className="text-xs text-gray-500">
                  Current stage: {statusLabel(editing.status)}
                  {editing.archivedAt ? " · Archived" : ""}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
              <button
                onClick={() => closeModal()}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveContact}
                disabled={saving}
                className="rounded-lg bg-[#303380] px-4 py-2 text-sm font-medium text-white hover:bg-[#252a6b] disabled:opacity-50"
              >
                {saving ? "Saving…" : editing ? "Save" : "Add contact"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, isOpen: false })}
      />
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#303380] focus:ring-2 focus:ring-[#303380]/30";

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MessageSquare,
  MessageSquareOff,
  X,
  Users,
  Calendar,
  StickyNote,
} from "lucide-react";
import { AlertModal } from "@/components/modals/AlertModal";
import UnifiedLoading from "@/components/loading/UnifiedLoading";

type CrmContact = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  phoneNumber: string;
  contactReason: string;
  hasWritten: boolean;
  email: string | null;
  dateOfBirth: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: { id: string; name: string; email: string } | null;
};

type FormState = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  contactReason: string;
  hasWritten: boolean;
  email: string;
  dateOfBirth: string;
  notes: string;
};

type WrittenFilter = "ALL" | "true" | "false";

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  contactReason: "",
  hasWritten: false,
  email: "",
  dateOfBirth: "",
  notes: "",
};

function toDateInput(value: string | null): string {
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

export default function CrmPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [writtenFilter, setWrittenFilter] = useState<WrittenFilter>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CrmContact | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [alert, setAlert] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "info",
  });

  const role = (session?.user as { role?: string } | undefined)?.role;
  const allowed = role === "ADMIN" || role === "BOSS" || role === "CREATOR";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (writtenFilter !== "ALL") params.set("written", writtenFilter);
      const res = await fetch(`/api/crm/contacts?${params}`);
      const data = await res.json();
      if (res.ok) setContacts(data.contacts ?? []);
    } catch (e) {
      console.error("Load CRM contacts:", e);
    } finally {
      setLoading(false);
    }
  }, [search, writtenFilter]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated" && !allowed) {
      router.push("/auth/login?error=unauthorized");
      return;
    }
    if (status === "authenticated" && allowed) load();
  }, [status, allowed, load, router]);

  const stats = useMemo(
    () => ({
      total: contacts.length,
      written: contacts.filter((c) => c.hasWritten).length,
      notWritten: contacts.filter((c) => !c.hasWritten).length,
    }),
    [contacts]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
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
      hasWritten: contact.hasWritten,
      email: contact.email ?? "",
      dateOfBirth: toDateInput(contact.dateOfBirth),
      notes: contact.notes ?? "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
  };

  const saveContact = async () => {
    setFormError("");
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber,
        contactReason: form.contactReason,
        hasWritten: form.hasWritten,
        email: form.email,
        dateOfBirth: form.dateOfBirth,
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

      closeModal();
      await load();
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

  const deleteContact = async (contact: CrmContact) => {
    if (!confirm(`Delete ${contact.name}?\n\nThis cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/crm/contacts/${contact.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({
          isOpen: true,
          title: "Error",
          message: data.error || "Failed to delete",
          type: "error",
        });
        return;
      }
      await load();
    } catch {
      setAlert({
        isOpen: true,
        title: "Error",
        message: "Failed to delete contact",
        type: "error",
      });
    }
  };

  if (status === "loading" || (status === "authenticated" && !allowed)) {
    return <UnifiedLoading type="spinner" variant="spinner" size="md" />;
  }

  return (
    <div className="max-w-[100vw] overflow-x-hidden p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM Contacts</h1>
          <p className="mt-1 text-sm text-gray-600">
            People you&apos;ve reached out to for registration and exams.
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

      {/* Compact stats */}
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Total:</span>
          <span className="font-medium text-gray-900">{stats.total}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Written:</span>
          <span className="font-medium text-gray-900">{stats.written}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Not written:</span>
          <span className="font-medium text-gray-900">{stats.notWritten}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Search name, phone, email, reason, notes…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#303380] focus:ring-2 focus:ring-[#303380]/30"
          />
        </div>
        <select
          value={writtenFilter}
          onChange={(e) => setWrittenFilter(e.target.value as WrittenFilter)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#303380] focus:ring-2 focus:ring-[#303380]/30"
        >
          <option value="ALL">All contacts</option>
          <option value="false">Not written yet</option>
          <option value="true">Written to</option>
        </select>
        <button
          onClick={load}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">Loading…</div>
        ) : contacts.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p>No contacts yet</p>
            <button
              onClick={openCreate}
              className="mt-3 text-sm font-medium text-[#303380] hover:underline"
            >
              Add your first contact
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Mobile
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Written
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Date of birth
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Notes
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Added
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
                      {contact.contactReason}
                    </td>
                    <td className="px-4 py-3">
                      {contact.hasWritten ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          <MessageSquare className="h-3 w-3" />
                          Written
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                          <MessageSquareOff className="h-3 w-3" />
                          Not yet
                        </span>
                      )}
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
                    <td className="px-4 py-3 text-gray-600">
                      {contact.dateOfBirth ? (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {new Date(contact.dateOfBirth).toLocaleDateString()}
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
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(contact.createdAt).toLocaleDateString()}
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
                        <button
                          onClick={() => deleteContact(contact)}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? "Edit contact" : "Add contact"}
              </h2>
              <button
                onClick={closeModal}
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

              <FormField label="Why contact was made *">
                <input
                  value={form.contactReason}
                  onChange={(e) =>
                    setForm({ ...form, contactReason: e.target.value })
                  }
                  className={inputClass}
                  placeholder="e.g. Sunday Examiner, IELTS mock exam"
                />
              </FormField>

              <FormField label="Written to?">
                <select
                  value={form.hasWritten ? "yes" : "no"}
                  onChange={(e) =>
                    setForm({ ...form, hasWritten: e.target.value === "yes" })
                  }
                  className={inputClass}
                >
                  <option value="no">Not written yet</option>
                  <option value="yes">Written</option>
                </select>
              </FormField>

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
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
              <button
                onClick={closeModal}
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

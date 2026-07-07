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
} from "lucide-react";
import { AlertModal } from "@/components/modals/AlertModal";

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

export default function CrmPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [writtenFilter, setWrittenFilter] = useState<"ALL" | "true" | "false">("ALL");
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
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#303380] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM Contacts</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track people you have contacted for registration and outreach
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#303380] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#252a6b]"
        >
          <Plus className="h-4 w-4" />
          Add contact
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total contacts" value={stats.total} />
        <StatCard label="Written to" value={stats.written} accent="text-emerald-600" />
        <StatCard label="Not written yet" value={stats.notWritten} accent="text-amber-600" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Search name, phone, email, reason, notes..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-[#303380] focus:outline-none focus:ring-2 focus:ring-[#303380]/20"
          />
        </div>
        <select
          value={writtenFilter}
          onChange={(e) => setWrittenFilter(e.target.value as typeof writtenFilter)}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
        >
          <option value="ALL">All — written status</option>
          <option value="true">Written to</option>
          <option value="false">Not written yet</option>
        </select>
        <button
          onClick={load}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
        >
          Search
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-gray-500">
            Loading contacts...
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-gray-500">
            <p>No contacts yet</p>
            <button onClick={openCreate} className="mt-2 text-sm text-[#303380] hover:underline">
              Add your first contact
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Contact reason</th>
                  <th className="px-4 py-3">Written</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Date of birth</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3">Added</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      {contact.createdBy && (
                        <div className="text-xs text-gray-500">
                          by {contact.createdBy.name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        {contact.phoneNumber}
                      </span>
                    </td>
                    <td className="max-w-[200px] px-4 py-3 text-sm text-gray-700">
                      {contact.contactReason}
                    </td>
                    <td className="px-4 py-3">
                      {contact.hasWritten ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                          <MessageSquare className="h-3 w-3" />
                          Written
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                          <MessageSquareOff className="h-3 w-3" />
                          Not yet
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {contact.email ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          {contact.email}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {contact.dateOfBirth
                        ? new Date(contact.dateOfBirth).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-sm text-gray-600">
                      {contact.notes || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(contact)}
                          className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => deleteContact(contact)}
                          className="rounded-lg border border-red-200 p-2 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? "Edit contact" : "Add contact"}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="First name *">
                  <input
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Last name *">
                  <input
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className={inputClass}
                  />
                </FormField>
              </div>

              <FormField label="Mobile number *">
                <input
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  className={inputClass}
                  placeholder="+994 XX XXX XX XX"
                />
              </FormField>

              <FormField label="Why contact was made *">
                <input
                  value={form.contactReason}
                  onChange={(e) => setForm({ ...form, contactReason: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Sunday Examiner registration, IELTS mock exam"
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    className={inputClass}
                  />
                </FormField>
              </div>

              <FormField label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={4}
                  className={inputClass}
                  placeholder="Additional notes about this contact..."
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveContact}
                disabled={saving}
                className="rounded-lg bg-[#303380] px-4 py-2 text-sm font-medium text-white hover:bg-[#252a6b] disabled:opacity-50"
              >
                {saving ? "Saving..." : editing ? "Save changes" : "Add contact"}
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

function StatCard({
  label,
  value,
  accent = "text-gray-900",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
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
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#303380] focus:outline-none focus:ring-2 focus:ring-[#303380]/20";

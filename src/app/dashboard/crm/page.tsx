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
  Sparkles,
  Calendar,
  StickyNote,
  UserRound,
  Filter,
  ChevronRight,
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

const AVATAR_COLORS = [
  "from-[#303380] to-[#4f46e5]",
  "from-violet-600 to-purple-600",
  "from-sky-600 to-blue-600",
  "from-emerald-600 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
];

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

function avatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function relativeDate(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
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
      withEmail: contacts.filter((c) => c.email).length,
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#303380] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50/80">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#303380] via-[#252a6b] to-[#1a1f4a] px-4 pb-28 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />
          <div className="absolute right-1/3 top-1/2 h-40 w-40 rounded-full bg-violet-300/10 blur-2xl" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Outreach &amp; registration pipeline
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                CRM Contacts
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/70 sm:text-base">
                Track everyone you&apos;ve reached out to — before they register for
                Sunday Examiner or mock exams.
              </p>
            </div>

            <button
              onClick={openCreate}
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#303380] shadow-lg shadow-black/20 transition hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 transition group-hover:rotate-90" />
              Add contact
            </button>
          </div>

          {/* Search in hero */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                placeholder="Search name, phone, email, reason, notes..."
                className="w-full rounded-xl border-0 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 shadow-lg shadow-black/10 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <button
              onClick={load}
              className="rounded-xl bg-white/15 px-5 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        {/* Stats — overlap hero */}
        <div className="-mt-20 mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard
            icon={Users}
            label="Total contacts"
            value={stats.total}
            gradient="from-[#303380] to-indigo-600"
          />
          <StatCard
            icon={MessageSquare}
            label="Written to"
            value={stats.written}
            gradient="from-emerald-500 to-teal-600"
          />
          <StatCard
            icon={MessageSquareOff}
            label="Awaiting reply"
            value={stats.notWritten}
            gradient="from-amber-500 to-orange-600"
          />
          <StatCard
            icon={Mail}
            label="With email"
            value={stats.withEmail}
            gradient="from-violet-500 to-purple-600"
          />
        </div>

        {/* Filter pills */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </span>
          {(
            [
              { id: "ALL", label: "All contacts" },
              { id: "false", label: "Not written yet" },
              { id: "true", label: "Written to" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setWrittenFilter(f.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                writtenFilter === f.id
                  ? "bg-[#303380] text-white shadow-md shadow-[#303380]/25"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-[#303380]/30 hover:text-[#303380]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Contact grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl bg-white p-5 ring-1 ring-slate-200/80"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-slate-200" />
                    <div className="h-3 w-24 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-slate-100" />
                  <div className="h-3 w-2/3 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#303380] to-indigo-600 text-white shadow-lg shadow-[#303380]/30">
              <UserRound className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No contacts yet</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Start building your outreach list. Add people you&apos;ve spoken with
              about registration.
            </p>
            <button
              onClick={openCreate}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#303380] px-5 py-2.5 text-sm font-medium text-white shadow-md hover:bg-[#252a6b]"
            >
              <Plus className="h-4 w-4" />
              Add first contact
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onEdit={() => openEdit(contact)}
                onDelete={() => deleteContact(contact)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="bg-gradient-to-r from-[#303380] to-[#4f46e5] px-6 py-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                    {editing ? "Edit contact" : "New contact"}
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    {editing ? editing.name : "Add to CRM"}
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-lg p-2 text-white/80 transition hover:bg-white/15 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[calc(92vh-140px)] overflow-y-auto p-6">
              {formError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="space-y-6">
                <FormSection title="Personal info" icon={UserRound}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="First name *">
                      <input
                        value={form.firstName}
                        onChange={(e) =>
                          setForm({ ...form, firstName: e.target.value })
                        }
                        className={inputClass}
                        placeholder="Ad"
                      />
                    </FormField>
                    <FormField label="Last name *">
                      <input
                        value={form.lastName}
                        onChange={(e) =>
                          setForm({ ...form, lastName: e.target.value })
                        }
                        className={inputClass}
                        placeholder="Soyad"
                      />
                    </FormField>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <div className="mt-4">
                    <FormField label="Email address">
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        className={inputClass}
                        placeholder="email@example.com"
                      />
                    </FormField>
                  </div>
                </FormSection>

                <FormSection title="Outreach" icon={MessageSquare}>
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
                  <div className="mt-4">
                    <FormField label="Written to?">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, hasWritten: false })}
                          className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition ${
                            !form.hasWritten
                              ? "border-amber-400 bg-amber-50 text-amber-800"
                              : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <MessageSquareOff className="h-4 w-4" />
                          Not yet
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, hasWritten: true })}
                          className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition ${
                            form.hasWritten
                              ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                              : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <MessageSquare className="h-4 w-4" />
                          Written
                        </button>
                      </div>
                    </FormField>
                  </div>
                </FormSection>

                <FormSection title="Notes" icon={StickyNote}>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={4}
                    className={inputClass}
                    placeholder="Follow-up details, conversation summary..."
                  />
                </FormSection>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
              <button
                onClick={closeModal}
                disabled={saving}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:flex-none sm:px-6"
              >
                Cancel
              </button>
              <button
                onClick={saveContact}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#303380] to-[#4f46e5] py-3 text-sm font-semibold text-white shadow-lg shadow-[#303380]/25 transition hover:shadow-xl disabled:opacity-50 sm:flex-none sm:px-8"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    {editing ? "Save changes" : "Add contact"}
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
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
  icon: Icon,
  label,
  value,
  gradient,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  gradient: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-lg shadow-slate-200/60 ring-1 ring-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-xl sm:p-5">
      <div
        className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${gradient} opacity-10 transition group-hover:opacity-20`}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ContactCard({
  contact,
  onEdit,
  onDelete,
}: {
  contact: CrmContact;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const grad = avatarGradient(contact.name);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-1 hover:shadow-xl hover:ring-[#303380]/20">
      <div className={`h-1.5 w-full bg-gradient-to-r ${grad}`} />

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-sm font-bold text-white shadow-md`}
            >
              {initials(contact.name)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-slate-900">
                {contact.name}
              </h3>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{contact.phoneNumber}</span>
              </p>
            </div>
          </div>

          {contact.hasWritten ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              <MessageSquare className="h-3 w-3" />
              Written
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
              <MessageSquareOff className="h-3 w-3" />
              Pending
            </span>
          )}
        </div>

        <div className="mb-4">
          <span className="inline-block max-w-full truncate rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {contact.contactReason}
          </span>
        </div>

        <div className="mb-4 space-y-2 text-sm text-slate-600">
          {contact.email && (
            <div className="flex items-center gap-2 truncate">
              <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
          {contact.dateOfBirth && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {new Date(contact.dateOfBirth).toLocaleDateString()}
            </div>
          )}
          {contact.notes && (
            <div className="flex gap-2 rounded-lg bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-500">
              <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <p className="line-clamp-2">{contact.notes}</p>
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-400">
            <span>{relativeDate(contact.createdAt)}</span>
            {contact.createdBy && (
              <span className="block truncate text-slate-400">
                by {contact.createdBy.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onEdit}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-[#303380]/10 hover:text-[#303380]"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function FormSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#303380]/10 text-[#303380]">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      {children}
    </section>
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
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-[#303380] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#303380]/15";

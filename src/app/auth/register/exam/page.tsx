"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";

type ExamCategory = "IELTS" | "SAT";

const EXAM_OPTIONS: {
  id: ExamCategory;
  label: string;
  description: string;
  accent: string;
}[] = [
  {
    id: "IELTS",
    label: "IELTS",
    description: "First IELTS mock exam will be added to your account",
    accent: "from-sky-500 to-blue-600",
  },
  {
    id: "SAT",
    label: "SAT",
    description: "First SAT mock exam will be added to your account",
    accent: "from-violet-500 to-purple-600",
  },
];

function RegisterExamContent() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    examCategory: "" as ExamCategory | "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.examCategory) {
      setError("Please select IELTS or SAT");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          dateOfBirth: form.dateOfBirth,
          phoneNumber: form.phoneNumber,
          email: form.email,
          password: form.password,
          examCategory: form.examCategory,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      const signInResult = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/auth/login?registered=1");
        return;
      }

      router.push("/dashboard/student/exams");
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1020] text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-10 lg:flex-row lg:items-center lg:gap-12">
        <div className="mb-10 max-w-xl lg:mb-0">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-sm text-amber-200">
            <GraduationCap className="h-4 w-4" />
            Sunday Examiner Registration
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Register for your
            <span className="block bg-gradient-to-r from-amber-300 via-orange-300 to-violet-300 bg-clip-text text-transparent">
              mock exam session
            </span>
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Create your account, choose IELTS or SAT, and your first exam will be
            assigned automatically. You will only have access to take exams.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Instant account approval
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              First exam added on registration
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Exam-only access — no lessons or homework
            </li>
          </ul>
        </div>

        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8">
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="First name" icon={User}>
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  className={inputClass}
                  placeholder="Ad"
                />
              </Field>
              <Field label="Last name" icon={User}>
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                  className={inputClass}
                  placeholder="Soyad"
                />
              </Field>
            </div>

            <Field label="Date of birth" icon={Calendar}>
              <input
                required
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setField("dateOfBirth", e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Mobile number" icon={Phone}>
              <input
                required
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => setField("phoneNumber", e.target.value)}
                className={inputClass}
                placeholder="+994 XX XXX XX XX"
              />
            </Field>

            <Field label="Email address" icon={Mail}>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className={inputClass}
                placeholder="you@email.com"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Password" icon={Lock}>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  className={inputClass}
                  placeholder="Min. 6 characters"
                />
              </Field>
              <Field label="Confirm password" icon={Lock}>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => setField("confirmPassword", e.target.value)}
                  className={inputClass}
                  placeholder="Repeat password"
                />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="rounded border-white/20 bg-white/10"
              />
              Show passwords
            </label>

            <div>
              <p className="mb-3 text-sm font-medium text-slate-200">
                Which exam do you want?
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {EXAM_OPTIONS.map((opt) => {
                  const selected = form.examCategory === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setField("examCategory", opt.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-amber-300/60 bg-amber-400/10 shadow-lg shadow-amber-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div
                        className={`mb-2 inline-flex rounded-lg bg-gradient-to-r ${opt.accent} px-2.5 py-1 text-xs font-semibold text-white`}
                      >
                        {opt.label}
                      </div>
                      <p className="text-xs text-slate-300">{opt.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-violet-500 py-3.5 font-semibold text-slate-950 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Register & get my exam"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-amber-300 hover:text-amber-200">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-200">
        {label}
      </span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        {children}
      </div>
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/10 py-3 pl-10 pr-4 text-white placeholder:text-slate-500 outline-none transition focus:border-amber-300/50 focus:ring-2 focus:ring-amber-400/20";

export default function RegisterExamPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b1020]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
        </div>
      }
    >
      <RegisterExamContent />
    </Suspense>
  );
}

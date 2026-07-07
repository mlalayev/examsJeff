"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Lock,
  Mail,
  Phone,
  User,
  UserPlus,
} from "lucide-react";

type ExamCategory = "IELTS" | "SAT";

const EXAM_OPTIONS: { id: ExamCategory; label: string; description: string }[] = [
  {
    id: "IELTS",
    label: "IELTS",
    description: "First IELTS mock exam will be added to your account",
  },
  {
    id: "SAT",
    label: "SAT",
    description: "First SAT mock exam will be added to your account",
  },
];

const inputClass =
  "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#303380] focus:border-transparent text-gray-900 placeholder-gray-400 transition-all";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#303380] via-[#252a6b] to-[#1a1f4a] px-4 py-8">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Sunday Examiner</h1>
          <p className="text-white/80 text-sm">
            Create your account and get your first mock exam instantly
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-white/10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="First name" icon={User} htmlFor="firstName">
                <input
                  id="firstName"
                  required
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  className={inputClass}
                  placeholder="Ad"
                />
              </Field>
              <Field label="Last name" icon={User} htmlFor="lastName">
                <input
                  id="lastName"
                  required
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                  className={inputClass}
                  placeholder="Soyad"
                />
              </Field>
            </div>

            <Field label="Date of birth" icon={Calendar} htmlFor="dateOfBirth">
              <input
                id="dateOfBirth"
                required
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setField("dateOfBirth", e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Mobile number" icon={Phone} htmlFor="phoneNumber">
              <input
                id="phoneNumber"
                required
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => setField("phoneNumber", e.target.value)}
                className={inputClass}
                placeholder="+994 XX XXX XX XX"
              />
            </Field>

            <Field label="Email address" icon={Mail} htmlFor="email">
              <input
                id="email"
                required
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className={inputClass}
                placeholder="Enter your email"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Password" icon={Lock} htmlFor="password">
                <input
                  id="password"
                  required
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  className={inputClass}
                  placeholder="Min. 6 characters"
                />
              </Field>
              <Field label="Confirm password" icon={Lock} htmlFor="confirmPassword">
                <input
                  id="confirmPassword"
                  required
                  type={showPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => setField("confirmPassword", e.target.value)}
                  className={inputClass}
                  placeholder="Repeat password"
                />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="rounded border-gray-300 text-[#303380] focus:ring-[#303380]"
              />
              Show passwords
            </label>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Which exam do you want?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EXAM_OPTIONS.map((opt) => {
                  const selected = form.examCategory === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setField("examCategory", opt.id)}
                      className={`rounded-lg border p-4 text-left transition-all ${
                        selected
                          ? "border-[#303380] bg-[#303380]/5 ring-2 ring-[#303380]/20"
                          : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-[#303380]" />
                        <span className="font-semibold text-gray-900">{opt.label}</span>
                      </div>
                      <p className="text-xs text-gray-500">{opt.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#303380] to-[#252a6b] hover:from-[#252a6b] hover:to-[#1a1f4a] text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Register &amp; get my exam</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-[#303380] hover:text-[#252a6b]"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-white/60 text-xs">© 2024 AI Mentor. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  htmlFor,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        {children}
      </div>
    </div>
  );
}

export default function RegisterExamPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#303380] via-[#252a6b] to-[#1a1f4a]">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterExamContent />
    </Suspense>
  );
}

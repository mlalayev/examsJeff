"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT" as "STUDENT" | "TEACHER",
    branchId: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/branches");
        const data = await res.json();
        setBranches(data.branches || []);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
        setIsBranchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.branchId) {
      setError("Please select a branch");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Registration successful, but login failed. Please try logging in manually.");
      } else {
        // Redirect based on role
        let redirectUrl = "/dashboard/student";
        if (formData.role === "TEACHER") {
          redirectUrl = "/dashboard/teacher";
        }
        router.push(redirectUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          {error && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Branch
              </label>
              <div className="relative" ref={branchDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsBranchOpen(!isBranchOpen)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-white flex items-center justify-between ${
                    formData.branchId ? "border-slate-300" : "border-slate-300 text-slate-500"
                  }`}
                >
                  <span>
                    {formData.branchId
                      ? branches.find((b) => b.id === formData.branchId)?.name ||
                        (formData.branchId === "fallback-28may" ? "28 May" : formData.branchId === "fallback-ahmadli" ? "Əhmədli" : "Select branch")
                      : "Select branch"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform ${
                      isBranchOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isBranchOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border-2 border-slate-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {branches.length > 0 ? (
                      branches.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, branchId: b.id });
                            setIsBranchOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition ${
                            formData.branchId === b.id ? "bg-slate-100 font-medium" : ""
                          }`}
                        >
                          {b.name}
                        </button>
                      ))
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, branchId: "fallback-28may" });
                            setIsBranchOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition ${
                            formData.branchId === "fallback-28may" ? "bg-slate-100 font-medium" : ""
                          }`}
                        >
                          28 May
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, branchId: "fallback-ahmadli" });
                            setIsBranchOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition ${
                            formData.branchId === "fallback-ahmadli" ? "bg-slate-100 font-medium" : ""
                          }`}
                        >
                          Əhmədli
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                I am a:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "STUDENT" })}
                  className={`px-3 py-2 rounded-lg border-2 font-medium transition ${
                    formData.role === "STUDENT"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "TEACHER" })}
                  className={`px-3 py-2 rounded-lg border-2 font-medium transition ${
                    formData.role === "TEACHER"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  Teacher
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-slate-900 hover:text-slate-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}


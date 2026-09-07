"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Library } from "lucide-react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";
import { STUDY_TYPES } from "@/lib/study-types";

export default function SubjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const allowed = role === "ADMIN" || role === "BOSS" || role === "CREATOR";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated" && !allowed) {
      router.push("/auth/login?error=unauthorized");
    }
  }, [status, allowed, router]);

  if (status === "loading" || (status === "authenticated" && !allowed)) {
    return <UnifiedLoading type="spinner" variant="spinner" size="md" />;
  }

  return (
    <div className="max-w-[100vw] overflow-x-hidden p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
        <p className="mt-1 text-sm text-gray-600">
          Subjects available for students, homework, filters, and CRM contact
          reasons.
        </p>
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className="text-gray-500">Total:</span>
        <span className="font-medium text-gray-900">{STUDY_TYPES.length}</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">
                  Subject
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">
                  Used for
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {STUDY_TYPES.map((subject) => (
                <tr key={subject.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${subject.accent}18` }}
                      >
                        <Library
                          className="h-4 w-4"
                          style={{ color: subject.accent }}
                        />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {subject.label}
                        </div>
                        <span
                          className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-xs ring-1 ring-inset ${subject.chip}`}
                        >
                          {subject.id}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    Student assignment, homework, filters, CRM
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

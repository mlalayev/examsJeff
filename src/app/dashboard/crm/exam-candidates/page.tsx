"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ExamCandidatesDashboard from "@/components/dashboard/ExamCandidatesDashboard";
import UnifiedLoading from "@/components/loading/UnifiedLoading";

export default function CrmExamCandidatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const allowed = role === "ADMIN" || role === "BOSS" || role === "CREATOR";
  const studentsListHref =
    role === "CREATOR"
      ? "/dashboard/creator/students"
      : "/dashboard/admin/students";

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
    <ExamCandidatesDashboard
      studentsListHref={studentsListHref}
      parentHref="/dashboard/crm"
      parentLabel="CRM"
    />
  );
}

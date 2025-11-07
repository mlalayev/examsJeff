"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session?.user) {
      router.push("/");
      return;
    }

    const role = (session.user as any)?.role;

    // Redirect based on role
    switch (role) {
      case "ADMIN":
        router.push("/dashboard/admin/students");
        break;
      case "BOSS":
        router.push("/dashboard/boss/finance");
        break;
      case "BRANCH_ADMIN":
        router.push("/dashboard/branch-admin/students");
        break;
      case "BRANCH_BOSS":
        router.push("/dashboard/branch-admin/students");
        break;
      case "TEACHER":
        router.push("/dashboard/teacher/classes");
        break;
      case "STUDENT":
        router.push("/dashboard/student/exams");
        break;
      default:
        router.push("/");
    }
  }, [session, router]);

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}


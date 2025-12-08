"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Users, DollarSign, BookOpen, GraduationCap, 
  Building2, ClipboardList, Shield
} from "lucide-react";

export default function CreatorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/login");
      return;
    }

    const role = (session.user as any)?.role;
    if (role !== "CREATOR") {
      router.push("/dashboard/student");
      return;
    }

    setLoading(false);
  }, [session, status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const role = (session?.user as any)?.role;
  if (role !== "CREATOR") {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Welcome Message - Similar to student dashboard */}
      <div className="mb-8 sm:mb-12">
        <h1 className="text-xl sm:text-2xl font-medium text-gray-900">
          Welcome to Creator Panel
        </h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          System administration and management
        </p>
      </div>

      {/* Welcome Content */}
      <div className="bg-white border border-gray-200 rounded-md p-8 sm:p-12">
        <div className="max-w-2xl mx-auto text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-medium text-gray-900 mb-4">
            Creator Dashboard
          </h2>
          <p className="text-gray-600 mb-6">
            Use the sidebar navigation to access different management sections:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-md mx-auto">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700">User Management</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
              <GraduationCap className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700">Students</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
              <BookOpen className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700">Exams</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
              <ClipboardList className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700">Classes</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
              <Building2 className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700">Branches</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
              <DollarSign className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700">Finance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

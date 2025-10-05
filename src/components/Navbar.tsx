"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { GraduationCap, LogOut, User } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();

  const getDashboardLink = () => {
    if (!session?.user) return null;
    
    const role = (session.user as any).role;
    if (role === "STUDENT") return "/dashboard/student";
    if (role === "TEACHER") return "/dashboard/teacher";
    if (role === "ADMIN") return "/dashboard/admin";
    return null;
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <GraduationCap className="w-6 h-6 text-blue-600" />
          JEFF Exams
        </Link>

        <div className="flex items-center gap-4">
          {status === "loading" ? (
            <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
          ) : session ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">
                  {session.user?.name || session.user?.email}
                </span>
                <span className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded">
                  {(session.user as any).role}
                </span>
              </div>
              
              {getDashboardLink() && (
                <Link
                  href={getDashboardLink()!}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Dashboard
                </Link>
              )}
              
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 transition"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-4 py-2 text-gray-700 font-medium hover:text-blue-600 transition"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}


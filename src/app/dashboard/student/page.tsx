"use client";

import { useSession } from "next-auth/react";

export default function StudentDashboard() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-[calc(100vh-5rem)] flex items-center justify-center">
        <div className="text-center w-full max-w-2xl px-4">
          {/* Logo Skeleton */}
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-white/20 mb-8">
            <div className="w-8 h-8 bg-gray-400 rounded-full animate-pulse"></div>
            <div className="h-4 bg-gray-400 rounded w-32 animate-pulse"></div>
          </div>

          {/* Title Skeleton */}
          <div className="mb-6 space-y-3">
            <div className="h-12 bg-gray-400 rounded w-64 mx-auto animate-pulse"></div>
            <div className="h-12 bg-gray-400 rounded w-48 mx-auto animate-pulse"></div>
          </div>

          {/* Description Skeleton */}
          <div className="mb-8 space-y-2 max-w-xl mx-auto">
            <div className="h-5 bg-gray-400 rounded w-full animate-pulse"></div>
            <div className="h-5 bg-gray-400 rounded w-3/4 mx-auto animate-pulse"></div>
          </div>

          {/* Info Badge Skeleton */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
            <div className="w-4 h-4 bg-gray-400 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-400 rounded w-48 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-white/20 mb-8">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">J</span>
          </div>
          <span className="text-slate-700 font-medium">JEFF Exams Portal</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
          Welcome,
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {session?.user?.name || session?.user?.email?.split('@')[0] || "Student"}!
          </span>
        </h1>

        <p className="text-lg text-slate-600 max-w-xl mx-auto mb-8">
          Your learning journey starts here. Practice with mock exams and track your progress.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-slate-600 text-sm">
          <span>📚</span>
          <span>Use the sidebar to navigate between different sections</span>
        </div>
      </div>
    </div>
  );
}

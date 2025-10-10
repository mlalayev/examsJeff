"use client";

import { useSession } from "next-auth/react";

export default function BossDashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-white/20 mb-8">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">J</span>
          </div>
          <span className="text-slate-700 font-medium">JEFF Exams Portal</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
          Welcome Back, 
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {session?.user?.name || session?.user?.email?.split('@')[0] || "Boss"}!
          </span>
        </h1>
        
        <p className="text-lg text-slate-600 max-w-xl mx-auto mb-8">
          Your command center for managing the entire JEFF Exams ecosystem.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-slate-600 text-sm">
          <span>💡</span>
          <span>Use the sidebar to navigate between different sections</span>
        </div>
      </div>
    </div>
  );
}




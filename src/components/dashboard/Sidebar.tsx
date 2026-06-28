"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Menu, X, Home, KeyRound } from "lucide-react";
import StudentNav from "@/components/dashboard/student/StudentNav";
import StaffNav from "@/components/dashboard/nav/StaffNav";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";

export default function Sidebar() {
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const [isOpen, setIsOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const usesStaffNav =
    role &&
    role !== "STUDENT" &&
    [
      "CREATOR",
      "BOSS",
      "ADMIN",
      "TEACHER",
      "BRANCH_ADMIN",
      "BRANCH_BOSS",
      "PARTNER",
    ].includes(role);

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-slate-200 rounded-md shadow-sm"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-200 overflow-y-auto z-40 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {isOpen && (
          <div className="lg:hidden flex justify-end p-4 border-b border-slate-200">
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-md transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div
          className={`px-4 sm:px-6 py-4 ${
            isOpen
              ? "lg:border-b border-slate-200"
              : "border-b border-slate-200"
          }`}
        >
          {status === "loading" ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-400 rounded-full animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 bg-gray-400 rounded w-24 animate-pulse" />
                <div className="h-3 bg-gray-400 rounded w-16 animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs flex-shrink-0"
                style={{ backgroundColor: "#303380" }}
              >
                {session?.user?.name?.charAt(0).toUpperCase() ||
                  session?.user?.email?.charAt(0).toUpperCase() ||
                  "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm truncate">
                  {session?.user?.name ||
                    session?.user?.email?.split("@")[0] ||
                    "User"}
                </p>
                <p className="text-xs text-slate-500 capitalize truncate">
                  {role?.toLowerCase().replace("_", " ") || "User"}
                </p>
              </div>
            </div>
          )}
        </div>

        <nav className="p-3 sm:p-4 pb-20">
          <div className="space-y-1">
            {status === "loading" ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2">
                    <div className="w-4 h-4 bg-gray-400 rounded animate-pulse" />
                    <div className="h-4 bg-gray-400 rounded w-24 animate-pulse" />
                  </div>
                ))}
              </>
            ) : role === "STUDENT" ? (
              <StudentNav onNavigate={() => setIsOpen(false)} />
            ) : usesStaffNav ? (
              <StaffNav role={role!} onNavigate={() => setIsOpen(false)} />
            ) : null}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t border-slate-200 space-y-1">
          {session && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setChangePasswordOpen(true);
              }}
              className="flex w-full items-center gap-3 px-3 py-2 rounded text-slate-700 hover:bg-slate-50 transition"
            >
              <KeyRound className="w-4 h-4" />
              <span className="text-sm font-medium">Change Password</span>
            </button>
          )}
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded text-slate-700 hover:bg-slate-50 transition"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
        </div>
      </aside>

      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </>
  );
}

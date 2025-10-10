"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { Bell, User, Settings, LogOut, ChevronDown } from "lucide-react";

export default function Header() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "BOSS":
        return "bg-red-100 text-red-700";
      case "BRANCH_ADMIN":
        return "bg-blue-100 text-blue-700";
      case "ADMIN":
        return "bg-purple-100 text-purple-700";
      case "TEACHER":
        return "bg-green-100 text-green-700";
      case "STUDENT":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "BOSS":
        return "Boss";
      case "BRANCH_ADMIN":
        return "Branch Admin";
      case "ADMIN":
        return "Admin";
      case "TEACHER":
        return "Teacher";
      case "STUDENT":
        return "Student";
      default:
        return role;
    }
  };

  return (
    <header className="fixed top-0 left-72 right-0 h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 z-10 shadow-sm">
      <div className="h-full flex items-center justify-between px-8">
        {/* Breadcrumb or page title could go here */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        </div>

        {/* Right side - Notifications and User menu */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors duration-150">
            <Bell className="w-5 h-5" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            </span>
          </button>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors duration-150"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white font-medium text-sm">
                  {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-slate-900">{user?.name || user?.email}</div>
                <div className="text-xs text-slate-500">{getRoleLabel(user?.role)}</div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 z-50">
                {/* User Info */}
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-white font-medium text-lg">
                        {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{user?.name || "User"}</p>
                      <p className="text-sm text-slate-500">{user?.email}</p>
                      <span className={`inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user?.role)}`}>
                        {getRoleLabel(user?.role)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      // Navigate to profile
                    }}
                    className="w-full flex items-center gap-3 px-6 py-3 text-slate-700 hover:bg-slate-50 transition-colors duration-150"
                  >
                    <User className="w-4 h-4" />
                    Profile Settings
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      // Navigate to preferences
                    }}
                    className="w-full flex items-center gap-3 px-6 py-3 text-slate-700 hover:bg-slate-50 transition-colors duration-150"
                  >
                    <Settings className="w-4 h-4" />
                    Preferences
                  </button>
                </div>

                {/* Sign Out */}
                <div className="border-t border-slate-200 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-6 py-3 text-red-600 hover:bg-red-50 transition-colors duration-150"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


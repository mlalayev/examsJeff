"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { 
  Bell, 
  User, 
  Settings, 
  LayoutDashboard,
  ChevronDown,
  LogOut
} from "lucide-react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";

interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  sentAt: string | null;
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session) {
      fetchNotifications();
    }
  }, [session]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications?limit=10");
      if (!response.ok) throw new Error("Failed to fetch notifications");
      const data = await response.json();
      setNotifications(data.notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDashboardLink = () => {
    if (!session?.user) return null;
    
    const role = (session.user as any).role;
    if (role === "STUDENT") return "/dashboard/student";
    if (role === "TEACHER") return "/dashboard/teacher";
    if (role === "ADMIN") return "/dashboard/admin";
    if (role === "BOSS") return "/dashboard/boss";
    if (role === "BRANCH_ADMIN") return "/dashboard/branch-admin";
    return null;
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "STUDENT": return "Student";
      case "TEACHER": return "Teacher";
      case "ADMIN": return "Admin";
      case "BOSS": return "Boss";
      case "BRANCH_ADMIN": return "Branch Admin";
      default: return role;
    }
  };

  const getUserDisplayName = () => {
    if (!session?.user) return "";
    const name = session.user.name || "";
    const email = session.user.email || "";
    
    if (name && name !== email) {
      return name;
    }
    
    // Extract name from email if no name is provided
    const emailName = email.split('@')[0];
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  };

  if (status === "loading") {
    return (
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <UnifiedLoading type="skeleton" variant="navbar" />
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-sm group-hover:scale-105 transition-transform duration-200">
              J
            </div>
            <span className="text-xl font-bold text-gray-900">JEFF Exams</span>
          </Link>

          {/* Right Side - Notifications and Profile */}
          <div className="flex items-center gap-4">
            {session ? (
              <>
                {/* Notifications */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                      </div>
                      {loading ? (
                        <div className="p-4 text-center">
                          <UnifiedLoading type="spinner" variant="spinner" size="sm" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No notifications yet
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {notifications.map((notification) => (
                            <div key={notification.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                              <p className="font-medium text-sm text-gray-900 mb-1">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mb-2">
                                {notification.body}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(notification.createdAt).toLocaleString('en-US', {
                                  timeZone: 'Asia/Baku',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-all duration-200"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 font-medium text-sm">
                      {getUserDisplayName().charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
                      {/* User Info */}
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 font-medium text-lg">
                            {getUserDisplayName().charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{getUserDisplayName()}</p>
                            <p className="text-xs text-gray-500">{getRoleDisplayName((session.user as any).role)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          href={getDashboardLink() || "/"}
                          className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>
                        
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                        
                        <Link
                          href="/settings"
                          className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                      </div>

                      {/* Sign Out */}
                      <div className="border-t border-gray-200 py-2">
                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-150 w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-gray-700 font-medium hover:text-gray-900 transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


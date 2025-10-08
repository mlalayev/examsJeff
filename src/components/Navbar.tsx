"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { GraduationCap, LogOut, User, Bell } from "lucide-react";

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      fetchNotifications();
    }
  }, [session]);

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
              {/* Notifications Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-700 hover:text-blue-600 transition"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-96 overflow-y-auto">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                      </div>
                      {loading ? (
                        <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No notifications yet
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {notifications.map((notification) => (
                            <div key={notification.id} className="p-4 hover:bg-gray-50 transition">
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
                  </>
                )}
              </div>

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
              
              {(session?.user as any)?.approved === false && ((session?.user as any)?.role === 'STUDENT' || (session?.user as any)?.role === 'TEACHER') ? (
                <Link href="/pending" className="ml-4 text-sm text-amber-600">Pending Approval</Link>
              ) : null}
              {(session?.user as any)?.role === 'BRANCH_ADMIN' && (session?.user as any)?.branchName ? (
                <span className="ml-4 text-sm text-blue-600 font-medium">
                  Managing Branch: {(session?.user as any)?.branchName}
                </span>
              ) : null}
              
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


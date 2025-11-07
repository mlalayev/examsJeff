"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import {
  LayoutDashboard,
  DollarSign,
  Users,
  Building2,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Clock,
  BarChart3,
  Settings,
  User,
  History,
  Calendar,
  FileText,
  CreditCard,
  CheckCircle,
  Home,
  Library,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  disabled?: boolean;
  comingSoon?: boolean;
};

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [isOpen, setIsOpen] = useState(false);

  const navItems: NavItem[] = [];

  // BOSS Navigation
  if (role === "BOSS") {
    navItems.push(
      {
        label: "Manage Users",
        href: "/dashboard/boss/users",
        icon: Users,
        color: "from-purple-500 to-purple-600",
      },
      {
        label: "Manage Branches",
        href: "/dashboard/boss/branches",
        icon: Building2,
        color: "from-orange-500 to-orange-600",
      },
      {
        label: "Finance",
        href: "/dashboard/boss/finance",
        icon: DollarSign,
        color: "from-emerald-500 to-emerald-600",
        disabled: true,
        comingSoon: true,
      }
    );
  }

  // BRANCH_ADMIN Navigation
  if (role === "BRANCH_ADMIN") {
    navItems.push(
      {
        label: "Students",
        href: "/dashboard/branch-admin/students",
        icon: Users,
        color: "from-purple-500 to-purple-600",
        disabled: true,
        comingSoon: true,
      },
      {
        label: "Classes",
        href: "/dashboard/branch-admin/classes",
        icon: BookOpen,
        color: "from-emerald-500 to-emerald-600",
        disabled: true,
        comingSoon: true,
      },
      {
        label: "Finance",
        href: "/dashboard/branch-admin/finance",
        icon: DollarSign,
        color: "from-orange-500 to-orange-600",
        disabled: true,
        comingSoon: true,
      },
      {
        label: "Approvals",
        href: "/dashboard/branch-admin/approvals",
        icon: CheckCircle,
        color: "from-green-500 to-green-600",
        disabled: true,
        comingSoon: true,
      }
    );
  }

  // ADMIN Navigation
  if (role === "ADMIN") {
    navItems.push(
      {
        label: "Students",
        href: "/dashboard/admin/students",
        icon: Users,
        color: "from-purple-500 to-purple-600",
      },
      {
        label: "Exams",
        href: "/dashboard/admin/exams",
        icon: BookOpen,
        color: "from-emerald-500 to-emerald-600",
      },
      {
        label: "Seed Demo Data",
        href: "/dashboard/admin/seed",
        icon: Settings,
        color: "from-orange-500 to-orange-600",
      }
    );
  }

  // TEACHER Navigation
  if (role === "TEACHER") {
    navItems.push(
      {
        label: "Classes",
        href: "/dashboard/teacher/classes",
        icon: BookOpen,
        color: "from-purple-500 to-purple-600",
      },
      {
        label: "Attempts",
        href: "/dashboard/teacher/attempts",
        icon: ClipboardList,
        color: "from-emerald-500 to-emerald-600",
      },
      {
        label: "Reports",
        href: "/dashboard/teacher/reports",
        icon: BarChart3,
        color: "from-cyan-500 to-cyan-600",
      },
      {
        label: "Exams",
        href: "/dashboard/teacher/exams",
        icon: ClipboardList,
        color: "from-emerald-500 to-emerald-600",
        disabled: true,
        comingSoon: true,
      },
      {
        label: "Grading",
        href: "/dashboard/teacher/grading",
        icon: CheckCircle,
        color: "from-orange-500 to-orange-600",
        disabled: true,
        comingSoon: true,
      },
      {
        label: "Schedule",
        href: "/dashboard/teacher/schedule",
        icon: Calendar,
        color: "from-pink-500 to-pink-600",
        disabled: true,
        comingSoon: true,
      },
      {
        label: "Salary",
        href: "/dashboard/teacher/salary",
        icon: CreditCard,
        color: "from-green-500 to-green-600",
        disabled: true,
        comingSoon: true,
      }
    );
  }

  // STUDENT Navigation
  if (role === "STUDENT") {
    navItems.push(
      {
        label: "My Exams",
        href: "/dashboard/student/exams",
        icon: BookOpen,
        color: "from-purple-500 to-purple-600",
      },
      {
        label: "History",
        href: "/dashboard/student/history",
        icon: History,
        color: "from-emerald-500 to-emerald-600",
      }
    );
  }

  return (
    <>
      {/* Mobile Menu Button - On Screen (when sidebar is closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-slate-200 rounded-md shadow-sm"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Mobile Overlay */}
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
        {/* Mobile Menu Button - On Sidebar (when sidebar is open) */}
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

        {/* User Profile Section */}
        <div
          className={`px-4 sm:px-6 py-4 ${
            isOpen
              ? "lg:border-b border-slate-200"
              : "border-b border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-medium text-xs flex-shrink-0">
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
        </div>

        {/* Navigation */}
        <nav className="p-3 sm:p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              const isDisabled = item.disabled || item.comingSoon;

              if (isDisabled) {
                return (
                  <div
                    key={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded text-slate-400 cursor-not-allowed"
                    title="Coming soon"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm text-slate-400">{item.label}</span>
                    <span className="ml-auto text-xs text-slate-400">Soon</span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded transition ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t border-slate-200">
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
    </>
  );
}

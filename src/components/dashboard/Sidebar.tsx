"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
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
  Library
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

  const navItems: NavItem[] = [];

  // BOSS Navigation
  if (role === "BOSS") {
    navItems.push(
      {
        label: "Dashboard",
        href: "/dashboard/boss",
        icon: LayoutDashboard,
        color: "from-blue-500 to-blue-600",
        disabled: true,
        comingSoon: true
      },
      {
        label: "Finance",
        href: "/dashboard/boss/finance",
        icon: DollarSign,
        color: "from-emerald-500 to-emerald-600",
        disabled: true,
        comingSoon: true
      },
      {
        label: "Manage Users",
        href: "/dashboard/boss/users",
        icon: Users,
        color: "from-purple-500 to-purple-600",
        disabled: true,
        comingSoon: true
      },
      {
        label: "Manage Branches",
        href: "/dashboard/boss/branches",
        icon: Building2,
        color: "from-orange-500 to-orange-600",
        disabled: true,
        comingSoon: true
      }
    );
  }

  // BRANCH_ADMIN Navigation
  if (role === "BRANCH_ADMIN") {
    navItems.push(
      {
        label: "Dashboard",
        href: "/dashboard/branch-admin",
        icon: LayoutDashboard,
        color: "from-blue-500 to-blue-600",
        disabled: true,
        comingSoon: true
      },
      {
        label: "Students",
        href: "/dashboard/branch-admin/students",
        icon: Users,
        color: "from-purple-500 to-purple-600",
        disabled: true,
        comingSoon: true
      },
      {
        label: "Classes",
        href: "/dashboard/branch-admin/classes",
        icon: BookOpen,
        color: "from-emerald-500 to-emerald-600",
        disabled: true,
        comingSoon: true
      },
      {
        label: "Finance",
        href: "/dashboard/branch-admin/finance",
        icon: DollarSign,
        color: "from-orange-500 to-orange-600",
        disabled: true,
        comingSoon: true
      },
      {
        label: "Approvals",
        href: "/dashboard/branch-admin/approvals",
        icon: CheckCircle,
        color: "from-green-500 to-green-600",
        disabled: true,
        comingSoon: true
      }
    );
  }

  // ADMIN Navigation
  if (role === "ADMIN") {
    navItems.push(
      {
        label: "Dashboard",
        href: "/dashboard/admin",
        icon: LayoutDashboard,
        color: "from-blue-500 to-blue-600",
        disabled: true,
        comingSoon: true
      },
      {
        label: "Students",
        href: "/dashboard/admin/students",
        icon: Users,
        color: "from-purple-500 to-purple-600",
        disabled: true,
        comingSoon: true
      },
      {
        label: "Exams",
        href: "/dashboard/admin/exams",
        icon: BookOpen,
        color: "from-emerald-500 to-emerald-600",
        disabled: true,
        comingSoon: true
      },
      {
        label: "Seed Demo Data",
        href: "/dashboard/admin/seed",
        icon: Settings,
        color: "from-orange-500 to-orange-600",
        disabled: true,
        comingSoon: true
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
        color: "from-purple-500 to-purple-600"
      },
      {
        label: "Attempts",
        href: "/dashboard/teacher/attempts",
        icon: ClipboardList,
        color: "from-emerald-500 to-emerald-600"
      },
      {
        label: "Reports",
        href: "/dashboard/teacher/reports",
        icon: BarChart3,
        color: "from-cyan-500 to-cyan-600"
      },
      {
        label: "Catalog",
        href: "/dashboard/catalog",
        icon: Library,
        color: "from-indigo-500 to-indigo-600",
        disabled: true,
        comingSoon: true
      },
      {
        label: "Exams",
        href: "/dashboard/teacher/exams",
        icon: ClipboardList,
        color: "from-emerald-500 to-emerald-600",
        disabled: true,
        comingSoon: true
      },
      {
        label: "Grading",
        href: "/dashboard/teacher/grading",
        icon: CheckCircle,
        color: "from-orange-500 to-orange-600",
        disabled: true,
        comingSoon: true
      },
      {
        label: "Schedule",
        href: "/dashboard/teacher/schedule",
        icon: Calendar,
        color: "from-pink-500 to-pink-600",
        disabled: true,
        comingSoon: true
      },
      {
        label: "Salary",
        href: "/dashboard/teacher/salary",
        icon: CreditCard,
        color: "from-green-500 to-green-600",
        disabled: true,
        comingSoon: true
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
        color: "from-purple-500 to-purple-600"
      },
      {
        label: "History",
        href: "/dashboard/student/history",
        icon: History,
        color: "from-emerald-500 to-emerald-600"
      },
      {
        label: "Dashboard",
        href: "/dashboard/student",
        icon: LayoutDashboard,
        color: "from-blue-500 to-blue-600",
        disabled: true,
        comingSoon: true
      },
      {
        label: "Catalog",
        href: "/dashboard/catalog",
        icon: Library,
        color: "from-indigo-500 to-indigo-600",
        disabled: true,
        comingSoon: true
      }
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/50 overflow-y-auto shadow-xl">
      {/* Combined Logo & User Section */}
      <div className="px-6 py-5 border-b border-slate-200/50">
        <Link href="/" className="flex items-center gap-3 group mb-4 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
            <span className="text-white font-bold text-lg">J</span>
          </div>
          <div>
            <span className="font-bold text-slate-900 text-lg block">JEFF Exams</span>
            <p className="text-xs text-slate-500">Dashboard</p>
          </div>
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
            {session?.user?.name?.charAt(0).toUpperCase() || session?.user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">
              {session?.user?.name || session?.user?.email?.split('@')[0] || "User"}
            </p>
            <p className="text-xs text-slate-500 capitalize truncate">
              {role?.toLowerCase().replace('_', ' ') || "User"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            const isDisabled = item.disabled || item.comingSoon;
            
            if (isDisabled) {
              return (
                <div
                  key={item.href}
                  className="group flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 cursor-not-allowed opacity-60 relative"
                  title="Coming soon"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <span className="font-medium text-slate-400">
                    {item.label}
                  </span>
                  <span className="ml-auto text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                    Soon
                  </span>
                </div>
              );
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl ${
                  isActive
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-200/50"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isActive 
                    ? `bg-gradient-to-r ${item.color} text-white shadow-sm` 
                    : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`font-medium ${isActive ? "text-blue-700" : "text-slate-700 group-hover:text-slate-900"}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200/50">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-200"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Home className="w-4 h-4" />
          </div>
          <span className="font-medium">Back to Home</span>
        </Link>
      </div>
    </aside>
  );
}


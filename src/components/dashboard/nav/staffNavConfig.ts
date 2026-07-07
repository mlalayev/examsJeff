import {
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  DollarSign,
  Wallet,
  FileText,
  UserPlus,
  Contact,
  Calendar,
  BarChart3,
} from "lucide-react";
import type { CollapsibleNavSectionItem } from "./CollapsibleNavSection";

const finished = (base: string) => `${base}/finished`;
const stopped = (base: string) => `${base}/stopped`;
const candidates = (base: string) => `${base}/candidates`;

export function getStaffNavSections(role: string): CollapsibleNavSectionItem[] {
  if (role === "CREATOR") {
    return [
      {
        id: "users",
        label: "Users",
        icon: Users,
        subs: [
          { label: "All Users", href: "/dashboard/creator/users" },
          { label: "Branches", href: "/dashboard/creator/branches" },
        ],
      },
      {
        id: "students",
        label: "Students",
        icon: GraduationCap,
        subs: [
          { label: "All Students", href: "/dashboard/creator/students" },
          { label: "Finished", href: finished("/dashboard/creator/students") },
          { label: "Stopped", href: stopped("/dashboard/creator/students") },
          { label: "Candidates", href: candidates("/dashboard/creator/students") },
        ],
      },
      {
        id: "content",
        label: "Content",
        icon: BookOpen,
        subs: [
          { label: "Exams", href: "/dashboard/creator/exams" },
          { label: "Homework", href: "/dashboard/creator/homework" },
          { label: "Classes", href: "/dashboard/creator/classes" },
        ],
      },
      {
        id: "finance",
        label: "Finance",
        icon: DollarSign,
        subs: [
          { label: "Finance", href: "/dashboard/creator/finance" },
          { label: "Teacher Salary", href: "/dashboard/boss/salary" },
          { label: "Weekly Reports", href: "/dashboard/boss/reports" },
        ],
      },
      {
        id: "referrals",
        label: "Referrals",
        icon: UserPlus,
        subs: [{ label: "Referrals", href: "/dashboard/referrals" }],
      },
      {
        id: "crm",
        label: "CRM",
        icon: Contact,
        subs: [{ label: "Contacts", href: "/dashboard/crm" }],
      },
    ];
  }

  if (role === "BOSS") {
    return [
      {
        id: "users",
        label: "Users",
        icon: Users,
        subs: [
          { label: "Manage Users", href: "/dashboard/boss/users" },
          { label: "Manage Branches", href: "/dashboard/boss/branches" },
        ],
      },
      {
        id: "teachers",
        label: "Teachers",
        icon: UserCheck,
        subs: [{ label: "Teachers", href: "/dashboard/boss/teachers" }],
      },
      {
        id: "students",
        label: "Students",
        icon: GraduationCap,
        subs: [
          { label: "All Students", href: "/dashboard/admin/students" },
          { label: "Finished", href: finished("/dashboard/admin/students") },
          { label: "Stopped", href: stopped("/dashboard/admin/students") },
          { label: "Candidates", href: candidates("/dashboard/admin/students") },
        ],
      },
      {
        id: "content",
        label: "Content",
        icon: BookOpen,
        subs: [
          { label: "Exams", href: "/dashboard/admin/exams" },
          { label: "Homework", href: "/dashboard/admin/homework" },
          { label: "Seed Demo Data", href: "/dashboard/admin/seed" },
        ],
      },
      {
        id: "finance",
        label: "Finance",
        icon: DollarSign,
        subs: [
          { label: "Finance", href: "/dashboard/boss/finance" },
          { label: "Teacher Salary", href: "/dashboard/boss/salary" },
          { label: "Weekly Reports", href: "/dashboard/boss/reports" },
        ],
      },
      {
        id: "referrals",
        label: "Referrals",
        icon: UserPlus,
        subs: [{ label: "Referrals", href: "/dashboard/referrals" }],
      },
      {
        id: "crm",
        label: "CRM",
        icon: Contact,
        subs: [{ label: "Contacts", href: "/dashboard/crm" }],
      },
    ];
  }

  if (role === "ADMIN") {
    return [
      {
        id: "students",
        label: "Students",
        icon: GraduationCap,
        subs: [
          { label: "All Students", href: "/dashboard/admin/students" },
          { label: "Finished", href: finished("/dashboard/admin/students") },
          { label: "Stopped", href: stopped("/dashboard/admin/students") },
          { label: "Candidates", href: candidates("/dashboard/admin/students") },
        ],
      },
      {
        id: "content",
        label: "Content",
        icon: BookOpen,
        subs: [
          { label: "Exams", href: "/dashboard/admin/exams" },
          { label: "Homework", href: "/dashboard/admin/homework" },
          { label: "Seed Demo Data", href: "/dashboard/admin/seed" },
        ],
      },
      {
        id: "referrals",
        label: "Referrals",
        icon: UserPlus,
        subs: [{ label: "Referrals", href: "/dashboard/referrals" }],
      },
      {
        id: "crm",
        label: "CRM",
        icon: Contact,
        subs: [{ label: "Contacts", href: "/dashboard/crm" }],
      },
    ];
  }

  if (role === "TEACHER") {
    return [
      {
        id: "teaching",
        label: "Teaching",
        icon: Calendar,
        subs: [
          { label: "Schedule", href: "/dashboard/teacher/schedule" },
          { label: "Homework", href: "/dashboard/teacher/homework" },
        ],
      },
      {
        id: "more",
        label: "More",
        icon: BarChart3,
        subs: [
          { label: "Reports", href: "/dashboard/teacher/reports", comingSoon: true, disabled: true },
          { label: "Exams", href: "/dashboard/teacher/exams", comingSoon: true, disabled: true },
          { label: "Grading", href: "/dashboard/teacher/grading", comingSoon: true, disabled: true },
          { label: "Salary", href: "/dashboard/teacher/salary", comingSoon: true, disabled: true },
        ],
      },
    ];
  }

  if (role === "BRANCH_ADMIN") {
    return [
      {
        id: "students",
        label: "Students",
        icon: Users,
        subs: [
          { label: "Students", href: "/dashboard/branch-admin/students", comingSoon: true, disabled: true },
        ],
      },
      {
        id: "content",
        label: "Content",
        icon: BookOpen,
        subs: [
          { label: "Classes", href: "/dashboard/branch-admin/classes", comingSoon: true, disabled: true },
        ],
      },
      {
        id: "finance",
        label: "Finance",
        icon: DollarSign,
        subs: [
          { label: "Finance", href: "/dashboard/branch-admin/finance", comingSoon: true, disabled: true },
          { label: "Approvals", href: "/dashboard/branch-admin/approvals", comingSoon: true, disabled: true },
        ],
      },
      {
        id: "referrals",
        label: "Referrals",
        icon: UserPlus,
        subs: [{ label: "Referrals", href: "/dashboard/referrals" }],
      },
    ];
  }

  if (role === "BRANCH_BOSS") {
    return [
      {
        id: "referrals",
        label: "Referrals",
        icon: UserPlus,
        subs: [{ label: "Referrals", href: "/dashboard/referrals" }],
      },
    ];
  }

  if (role === "PARTNER") {
    return [
      {
        id: "partner",
        label: "Partner",
        icon: Wallet,
        subs: [
          { label: "Referrals", href: "/dashboard/partner/referrals" },
          { label: "Earnings", href: "/dashboard/partner/earnings" },
        ],
      },
    ];
  }

  return [];
}

export function staffNavUsesExactMatch(role: string): boolean {
  return role === "CREATOR";
}

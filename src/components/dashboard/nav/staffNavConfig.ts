import {
  Users,
  UserCheck,
  BookOpen,
  DollarSign,
  Wallet,
  FileText,
  UserPlus,
  Contact,
  Calendar,
  BarChart3,
  Library,
  School,
} from "lucide-react";
import type { CollapsibleNavSectionItem } from "./CollapsibleNavSection";
import type { CollapsibleSubItem } from "./navUtils";

function studentSubs(base: string): CollapsibleSubItem[] {
  return [
    { label: "All users", href: "/dashboard/users/all" },
    { label: "Parents", href: "/dashboard/users/parents" },
    { label: "Partners", href: "/dashboard/users/partners" },
    { label: "Active students", href: base },
    { label: "Alumni", href: `${base}/finished` },
    { label: "Sunday examiners", href: "/dashboard/users/sunday-examiners" },
    { label: "Archive", href: `${base}/archive` },
  ];
}
function crmSubs(): CollapsibleSubItem[] {
  return [
    { label: "All contacts", href: "/dashboard/crm" },
    { label: "New inquiry", href: "/dashboard/crm/stages/WRITTEN" },
    { label: "Consultation booked", href: "/dashboard/crm/stages/CONSULTATION_BOOKED" },
    { label: "Attended trial lesson", href: "/dashboard/crm/stages/TRIAL_ATTENDED" },
    { label: "Joined classes", href: "/dashboard/crm/stages/ENROLLED" },
  ];
}

function subjectsSubs(): CollapsibleSubItem[] {
  return [{ label: "Subjects", href: "/dashboard/subjects" }];
}

export function getStaffDashboardHref(role: string): string | null {
  switch (role) {
    case "CREATOR":
      return "/dashboard/creator";
    case "BOSS":
      return "/dashboard/boss";
    case "ADMIN":
      return "/dashboard/admin";
    case "TEACHER":
      return "/dashboard/teacher";
    case "BRANCH_ADMIN":
    case "BRANCH_BOSS":
      return "/dashboard/branch-admin";
    case "PARTNER":
      return "/dashboard/partner";
    default:
      return null;
  }
}

export function getStaffNavSections(role: string): CollapsibleNavSectionItem[] {
  if (role === "CREATOR") {
    return [
      {
        id: "users",
        label: "Users",
        icon: Users,
        subs: studentSubs("/dashboard/creator/students"),
      },
      {
        id: "crm",
        label: "CRM",
        icon: Contact,
        subs: crmSubs(),
      },
      {
        id: "subjects",
        label: "Subjects",
        icon: Library,
        subs: subjectsSubs(),
      },
      {
        id: "courses",
        label: "Courses",
        icon: School,
        subs: [{ label: "Classes", href: "/dashboard/creator/classes" }, { label: "Student register", href: "/dashboard/student-register" }, { label: "Branches", href: "/dashboard/creator/branches" }],
      },
      {
        id: "exams",
        label: "Exams",
        icon: FileText,
        subs: [{ label: "Exams", href: "/dashboard/creator/exams" }],
      },
      {
        id: "content",
        label: "Content",
        icon: BookOpen,
        subs: [{ label: "Homework", href: "/dashboard/creator/homework" }],
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
    ];
  }

  if (role === "BOSS") {
    return [
      {
        id: "users",
        label: "Users",
        icon: Users,
        subs: studentSubs("/dashboard/admin/students"),
      },
      {
        id: "crm",
        label: "CRM",
        icon: Contact,
        subs: crmSubs(),
      },
      {
        id: "subjects",
        label: "Subjects",
        icon: Library,
        subs: subjectsSubs(),
      },
      {
        id: "courses",
        label: "Courses",
        icon: School,
        subs: [{ label: "Classes", href: "/dashboard/creator/classes" }, { label: "Student register", href: "/dashboard/student-register" }, { label: "Branches", href: "/dashboard/boss/branches" }],
      },
      {
        id: "exams",
        label: "Exams",
        icon: FileText,
        subs: [{ label: "Exams", href: "/dashboard/admin/exams" }],
      },
      {
        id: "content",
        label: "Content",
        icon: BookOpen,
        subs: [
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
        id: "teachers",
        label: "Teachers",
        icon: UserCheck,
        subs: [{ label: "Teachers", href: "/dashboard/boss/teachers" }],
      },
      {
        id: "referrals",
        label: "Referrals",
        icon: UserPlus,
        subs: [{ label: "Referrals", href: "/dashboard/referrals" }],
      },
    ];
  }

  if (role === "ADMIN") {
    return [
      {
        id: "users",
        label: "Users",
        icon: Users,
        subs: studentSubs("/dashboard/admin/students"),
      },
      {
        id: "crm",
        label: "CRM",
        icon: Contact,
        subs: crmSubs(),
      },
      {
        id: "subjects",
        label: "Subjects",
        icon: Library,
        subs: subjectsSubs(),
      },
      {
        id: "courses",
        label: "Courses",
        icon: School,
        subs: [{ label: "Classes", href: "/dashboard/creator/classes" }, { label: "Student register", href: "/dashboard/student-register" }],
      },
      {
        id: "exams",
        label: "Exams",
        icon: FileText,
        subs: [{ label: "Exams", href: "/dashboard/admin/exams" }],
      },
      {
        id: "content",
        label: "Content",
        icon: BookOpen,
        subs: [
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
          { label: "Student register", href: "/dashboard/student-register" },
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

export function staffNavUsesExactMatch(_role: string): boolean {
  return false;
}

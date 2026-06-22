import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  Library,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type StudentSubItem = {
  label: string;
  href: string;
};

/** Among sibling subs, return the single best-matching href (longest prefix wins). */
export function getActiveSubHref(
  pathname: string,
  subs: StudentSubItem[]
): string | null {
  let best: string | null = null;
  for (const sub of subs) {
    const matches =
      pathname === sub.href || pathname.startsWith(sub.href + "/");
    if (matches && (!best || sub.href.length > best.length)) {
      best = sub.href;
    }
  }
  return best;
}

export type StudentNavSectionItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  subs: StudentSubItem[];
};

export const studentNavSections: StudentNavSectionItem[] = [
  {
    id: "exam",
    label: "Exam",
    icon: BookOpen,
    subs: [
      { label: "Take Exam", href: "/dashboard/student/exams" },
      { label: "Exam History", href: "/dashboard/student/history" },
      { label: "My Coins", href: "/dashboard/student/coins" },
    ],
  },
  {
    id: "homework",
    label: "Homework",
    icon: ClipboardList,
    subs: [
      { label: "Homeworks", href: "/dashboard/student/homework" },
      { label: "Extras", href: "/dashboard/student/homework/extras" },
    ],
  },
  {
    id: "lessons",
    label: "Lessons",
    icon: GraduationCap,
    subs: [
      { label: "IELTS", href: "/dashboard/student/lessons/ielts" },
      { label: "TOEFL", href: "/dashboard/student/lessons/toefl" },
      { label: "SAT", href: "/dashboard/student/lessons/sat" },
      { label: "General English", href: "/dashboard/student/lessons/general" },
      { label: "Kids", href: "/dashboard/student/lessons/kids" },
    ],
  },
  {
    id: "words",
    label: "Words",
    icon: Library,
    subs: [
      { label: "Words for General", href: "/dashboard/student/words/general" },
      { label: "Words for SAT", href: "/dashboard/student/words/sat" },
      { label: "Words for IELTS", href: "/dashboard/student/words/ielts" },
    ],
  },
  {
    id: "tricks",
    label: "Tricks",
    icon: Sparkles,
    subs: [
      { label: "Writing", href: "/dashboard/student/tricks/writing" },
      { label: "Desmos", href: "/dashboard/student/tricks/desmos" },
    ],
  },
];

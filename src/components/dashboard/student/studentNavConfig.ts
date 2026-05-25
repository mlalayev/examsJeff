import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  Library,
  Sparkles,
  History,
  PlayCircle,
  PenSquare,
  FileText,
  Globe,
  Award,
  School,
  Baby,
  Calculator,
  type LucideIcon,
} from "lucide-react";

export type StudentSubItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type StudentNavSectionItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  subs: StudentSubItem[];
};

export const studentNavSections: StudentNavSectionItem[] = [
  {
    id: "exam",
    label: "Exam",
    icon: BookOpen,
    color: "from-violet-500 to-purple-600",
    subs: [
      { label: "Take Exam", href: "/dashboard/student/exams", icon: PlayCircle },
      { label: "Exam History", href: "/dashboard/student/history", icon: History },
    ],
  },
  {
    id: "homework",
    label: "Homework",
    icon: ClipboardList,
    color: "from-emerald-500 to-teal-600",
    subs: [
      { label: "Homeworks", href: "/dashboard/student/homework", icon: FileText },
      { label: "Extras", href: "/dashboard/student/homework/extras", icon: Sparkles },
    ],
  },
  {
    id: "lessons",
    label: "Lessons",
    icon: GraduationCap,
    color: "from-sky-500 to-blue-600",
    subs: [
      { label: "IELTS", href: "/dashboard/student/lessons/ielts", icon: Globe },
      { label: "TOEFL", href: "/dashboard/student/lessons/toefl", icon: Award },
      { label: "SAT", href: "/dashboard/student/lessons/sat", icon: School },
      { label: "General English", href: "/dashboard/student/lessons/general", icon: BookOpen },
      { label: "Kids", href: "/dashboard/student/lessons/kids", icon: Baby },
    ],
  },
  {
    id: "words",
    label: "Words",
    icon: Library,
    color: "from-amber-500 to-orange-500",
    subs: [
      { label: "Words for General", href: "/dashboard/student/words/general", icon: BookOpen },
      { label: "Words for SAT", href: "/dashboard/student/words/sat", icon: School },
      { label: "Words for IELTS", href: "/dashboard/student/words/ielts", icon: Globe },
    ],
  },
  {
    id: "tricks",
    label: "Tricks",
    icon: Sparkles,
    color: "from-pink-500 to-rose-600",
    subs: [
      { label: "Writing", href: "/dashboard/student/tricks/writing", icon: PenSquare },
      { label: "Desmos", href: "/dashboard/student/tricks/desmos", icon: Calculator },
    ],
  },
];

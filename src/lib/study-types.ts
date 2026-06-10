// Shared study-type + lesson-mode definitions used across the admin/boss UI
// and the user APIs. Kept free of React so it can be imported server-side too.

export type StudyTypeMeta = {
  id: string;
  label: string;
  /** Solid accent color (used for active pills / dots). */
  accent: string;
  /** Tailwind classes for a soft chip (bg + text + ring). */
  chip: string;
  /** Keywords for inferring the type from legacy free-text `program`. */
  keywords: string[];
};

export const STUDY_TYPES: StudyTypeMeta[] = [
  {
    id: "IELTS",
    label: "IELTS",
    accent: "#0284c7",
    chip: "bg-sky-50 text-sky-700 ring-sky-200",
    keywords: ["ielts"],
  },
  {
    id: "TOEFL",
    label: "TOEFL",
    accent: "#4f46e5",
    chip: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    keywords: ["toefl"],
  },
  {
    id: "DUOLINGO",
    label: "Duolingo",
    accent: "#16a34a",
    chip: "bg-green-50 text-green-700 ring-green-200",
    keywords: ["duolingo", "duo", "det"],
  },
  {
    id: "SAT",
    label: "SAT",
    accent: "#d97706",
    chip: "bg-amber-50 text-amber-700 ring-amber-200",
    keywords: ["sat"],
  },
  {
    id: "MATH",
    label: "Math",
    accent: "#0d9488",
    chip: "bg-teal-50 text-teal-700 ring-teal-200",
    keywords: ["math", "riyaziyyat", "riyazi"],
  },
  {
    id: "KIDS",
    label: "Kids",
    accent: "#db2777",
    chip: "bg-pink-50 text-pink-700 ring-pink-200",
    keywords: ["kid", "kids", "junior", "young", "uşaq", "usaq"],
  },
  {
    id: "GENERAL_ENGLISH",
    label: "General English",
    accent: "#7c3aed",
    chip: "bg-violet-50 text-violet-700 ring-violet-200",
    keywords: ["general english", "general", "english", "ingilis"],
  },
];

export const STUDY_TYPE_IDS = STUDY_TYPES.map((s) => s.id);

export const STUDY_TYPE_MAP: Record<string, StudyTypeMeta> = Object.fromEntries(
  STUDY_TYPES.map((s) => [s.id, s])
);

export type LessonModeMeta = {
  id: string;
  label: string;
  chip: string;
};

export const LESSON_MODES: LessonModeMeta[] = [
  { id: "INDIVIDUAL", label: "Individual", chip: "bg-blue-50 text-blue-700 ring-blue-200" },
  { id: "GROUP", label: "Group", chip: "bg-purple-50 text-purple-700 ring-purple-200" },
  { id: "ONLINE", label: "Online", chip: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  { id: "OFFLINE", label: "Offline", chip: "bg-slate-100 text-slate-700 ring-slate-200" },
];

export const LESSON_MODE_IDS = LESSON_MODES.map((m) => m.id);

export const LESSON_MODE_MAP: Record<string, LessonModeMeta> = Object.fromEntries(
  LESSON_MODES.map((m) => [m.id, m])
);

/** Infer study types from a legacy free-text program string. */
export function inferStudyTypesFromProgram(program?: string | null): string[] {
  if (!program) return [];
  const p = program.toLowerCase();
  const found = STUDY_TYPES.filter((t) => t.keywords.some((kw) => p.includes(kw)));
  return found.map((t) => t.id);
}

/**
 * Resolve the effective study types for a student: prefer the structured
 * `studyTypes`, falling back to inference from the legacy `program` text.
 */
export function resolveStudyTypes(
  studyTypes?: string[] | null,
  program?: string | null
): string[] {
  if (studyTypes && studyTypes.length > 0) {
    return studyTypes.filter((id) => STUDY_TYPE_MAP[id]);
  }
  return inferStudyTypesFromProgram(program);
}

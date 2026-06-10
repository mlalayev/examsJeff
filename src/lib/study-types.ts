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
    id: "SAT_VERBAL",
    label: "SAT Verbal",
    accent: "#d97706",
    chip: "bg-amber-50 text-amber-700 ring-amber-200",
    keywords: ["sat verbal", "sat reading", "sat english"],
  },
  {
    id: "SAT_MATH",
    label: "SAT Math",
    accent: "#ea580c",
    chip: "bg-orange-50 text-orange-700 ring-orange-200",
    keywords: ["sat math", "sat riyaziyyat"],
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

// ---------------------------------------------------------------------------
// Student kind (regular vs exam-taker) + lifecycle status
// ---------------------------------------------------------------------------

export const STUDENT_KIND_OPTIONS = [
  { id: "STUDENT", label: "Student" },
  { id: "EXAM_TAKER", label: "Exam taker" },
] as const;

export const STUDENT_STATUS_OPTIONS = [
  { id: "CONTINUES", label: "Continues" },
  { id: "FINISHED", label: "Finished" },
  { id: "STOPPED", label: "Stopped" },
] as const;

export type StudentBucketMeta = { id: string; label: string; accent: string };

/** Mutually-exclusive buckets used by the students filter bar. */
export const STUDENT_BUCKETS: StudentBucketMeta[] = [
  { id: "CONTINUES", label: "Continues", accent: "#16a34a" },
  { id: "FINISHED", label: "Finished", accent: "#2563eb" },
  { id: "STOPPED", label: "Stopped", accent: "#dc2626" },
  { id: "EXAM_TAKER", label: "Exam takers", accent: "#7c3aed" },
];

export const STUDENT_BUCKET_MAP: Record<string, StudentBucketMeta> =
  Object.fromEntries(STUDENT_BUCKETS.map((b) => [b.id, b]));

/**
 * Resolve the single lifecycle bucket a student belongs to. Exam-takers always
 * win; a stopped/paused student is "STOPPED"; otherwise the stored status.
 */
export function resolveStudentBucket(s: {
  studentKind?: string | null;
  studyStatus?: string | null;
  lessonsStopped?: boolean | null;
}): string {
  if (s.studentKind === "EXAM_TAKER") return "EXAM_TAKER";
  if (s.lessonsStopped || s.studyStatus === "STOPPED") return "STOPPED";
  if (s.studyStatus === "FINISHED") return "FINISHED";
  return "CONTINUES";
}

/** Infer study types from a legacy free-text program string. */
export function inferStudyTypesFromProgram(program?: string | null): string[] {
  if (!program) return [];
  const p = program.toLowerCase();
  const found = new Set(
    STUDY_TYPES.filter((t) => t.keywords.some((kw) => p.includes(kw))).map((t) => t.id)
  );

  // Disambiguate substring overlaps so e.g. "SAT Math" is not also tagged as the
  // standalone "Math" type, and "SAT English/Reading" is not tagged "General English".
  if (found.has("SAT_MATH")) found.delete("MATH");
  if (found.has("SAT_VERBAL")) found.delete("GENERAL_ENGLISH");

  return STUDY_TYPES.filter((t) => found.has(t.id)).map((t) => t.id);
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
    const valid = studyTypes.filter((id) => STUDY_TYPE_MAP[id]);
    if (valid.length > 0) return valid;
  }
  return inferStudyTypesFromProgram(program);
}

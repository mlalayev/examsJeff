import { STUDY_TYPES } from "@/lib/study-types";

/**
 * Shared catalog of portal offerings.
 *
 * Subjects (Calculus, DİM, IELTS, …) live in STUDY_TYPES and are assigned to
 * students/courses/homework. Extra services such as Study Abroad are not
 * subjects but are selectable as CRM contact reasons and student subsections.
 */
export type CatalogItemKind = "subject" | "service";

export type PortalCatalogItem = {
  id: string;
  label: string;
  kind: CatalogItemKind;
  accent: string;
  chip: string;
};

export const STUDY_ABROAD_ID = "STUDY_ABROAD";
export const STUDY_ABROAD_LABEL = "Study Abroad / Xaricdə Təhsil";

export const SERVICE_CATALOG: PortalCatalogItem[] = [
  {
    id: STUDY_ABROAD_ID,
    label: STUDY_ABROAD_LABEL,
    kind: "service",
    accent: "#0f766e",
    chip: "bg-teal-50 text-teal-800 ring-teal-200",
  },
];

export const SUBJECT_CATALOG: PortalCatalogItem[] = STUDY_TYPES.map((s) => ({
  id: s.id,
  label: s.label,
  kind: "subject" as const,
  accent: s.accent,
  chip: s.chip,
}));

export const PORTAL_CATALOG: PortalCatalogItem[] = [
  ...SUBJECT_CATALOG,
  ...SERVICE_CATALOG,
];

/** CRM "why contact was made" options — subjects plus extra services. */
export const CRM_CONTACT_REASONS = PORTAL_CATALOG;

export function catalogLabel(idOrLabel: string): string {
  const match = PORTAL_CATALOG.find(
    (item) => item.id === idOrLabel || item.label === idOrLabel
  );
  return match?.label ?? idOrLabel;
}

export function isStudyAbroadReason(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return (
    v === STUDY_ABROAD_ID.toLowerCase() ||
    v === STUDY_ABROAD_LABEL.toLowerCase() ||
    v === "study abroad" ||
    v.includes("xaricdə təhsil") ||
    v.includes("xaricde tehsil") ||
    v.includes("study abroad")
  );
}

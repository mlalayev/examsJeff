/** Normalize stored TF answer to boolean | null for UI comparison. */
export function normalizeTfAnswer(value: unknown): boolean | null {
  if (value === true || value === false) return value;
  if (typeof value === "number") {
    if (value === 0) return true;
    if (value === 1) return false;
    return null;
  }
  if (typeof value === "string") {
    const upper = value.trim().toUpperCase();
    if (upper === "TRUE") return true;
    if (upper === "FALSE") return false;
  }
  return null;
}

export type TfngAnswer = "TRUE" | "FALSE" | "NOT_GIVEN";

/** Normalize stored TF_NG answer for UI comparison. */
export function normalizeTfngAnswer(value: unknown): TfngAnswer | null {
  if (value == null || value === "") return null;
  const raw = typeof value === "string" ? value.trim().toUpperCase() : String(value).trim().toUpperCase();
  if (raw === "TRUE") return "TRUE";
  if (raw === "FALSE") return "FALSE";
  if (raw === "NOT_GIVEN" || raw === "NOT GIVEN" || raw === "NG") return "NOT_GIVEN";
  return null;
}

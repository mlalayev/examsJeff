import type { ResultsData } from "./types";

/** Exam/API may return section type with different casing */
export function isWritingSectionType(type: unknown): boolean {
  return String(type ?? "").toUpperCase() === "WRITING";
}

export function isSpeakingSectionType(type: unknown): boolean {
  return String(type ?? "").toUpperCase() === "SPEAKING";
}

/** Saved AI writing band (DB); prefers overallBand, else average of tasks */
export function getPersistedWritingBand(
  ws: ResultsData["writingSubmission"] | null | undefined
): number | null {
  if (!ws) return null;
  if (typeof ws.overallBand === "number") return ws.overallBand;
  const t1 = ws.aiTask1Overall;
  const t2 = ws.aiTask2Overall;
  if (typeof t1 === "number" && typeof t2 === "number") {
    return +(((t1 + t2) / 2).toFixed(1));
  }
  return null;
}

export function hasSavedAiWriting(
  ws: ResultsData["writingSubmission"] | null | undefined
): boolean {
  if (!ws) return false;
  return getPersistedWritingBand(ws) != null;
}

export function getPersistedSpeakingBand(
  sa: ResultsData["speakingAi"] | null | undefined
): number | null {
  if (!sa) return null;
  if (typeof sa.overallBand === "number") return sa.overallBand;
  return null;
}

export function hasSavedAiSpeaking(
  sa: ResultsData["speakingAi"] | null | undefined
): boolean {
  if (!sa) return false;
  return getPersistedSpeakingBand(sa) != null;
}

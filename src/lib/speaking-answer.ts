/** Stored per speaking question in attempt_section.answers */
export type SpeakingAnswerPayload = {
  text: string;
  audioUrl: string;
};

export function speakingAnswerText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const o = value as { text?: string; transcript?: string };
    if (typeof o.text === "string" && o.text.trim()) return o.text.trim();
    if (typeof o.transcript === "string" && o.transcript.trim()) return o.transcript.trim();
  }
  return "";
}

export function speakingAnswerAudioUrl(value: unknown): string {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const url = (value as { audioUrl?: string }).audioUrl;
    return typeof url === "string" ? url.trim() : "";
  }
  return "";
}

export function hasSpeakingAnswerContent(value: unknown): boolean {
  return Boolean(speakingAnswerText(value) || speakingAnswerAudioUrl(value));
}

export function normalizeSpeakingAnswerPayload(
  value: unknown,
): SpeakingAnswerPayload | null {
  const text = speakingAnswerText(value);
  const audioUrl = speakingAnswerAudioUrl(value);
  if (!text && !audioUrl) return null;
  return { text, audioUrl };
}

/** Serve student recordings through /api/audio when stored under /audio/ */
export function resolveSpeakingAudioSrc(url: string): string {
  if (!url) return "";
  if (url.startsWith("/api/audio/")) return url;
  if (url.startsWith("/audio/")) {
    return `/api/audio/${url.replace(/^\/audio\//, "")}`;
  }
  return url;
}

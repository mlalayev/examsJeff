/**
 * AI writing feedback often starts with a word-count line (with or without emoji).
 * Splits that into a structured status + body for professional UI rendering.
 */
export type WordCountFeedbackStatus = "ok" | "penalty";

export interface ParsedWritingFeedback {
  /** Word count line text without leading emoji */
  wordCountLine: string | null;
  status: WordCountFeedbackStatus | null;
  /** Remaining feedback (trimmed) */
  body: string;
}

export function parseWritingFeedback(raw: string | null | undefined): ParsedWritingFeedback {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return { wordCountLine: null, status: null, body: "" };
  }

  // Legacy: emoji on first line only (supports \n\n or single \n before body)
  const emojiLineMatch = trimmed.match(/^(✅|⚠️)\s*([^\n]+)(?:\r?\n([\s\S]*))?$/u);
  if (emojiLineMatch) {
    const kind = emojiLineMatch[1];
    const line = (emojiLineMatch[2] ?? "").trim();
    const body = (emojiLineMatch[3] ?? "").trim();
    return {
      wordCountLine: line || null,
      status: kind === "✅" ? "ok" : "penalty",
      body,
    };
  }

  const splitIdx = trimmed.indexOf("\n\n");
  const first =
    splitIdx === -1 ? trimmed : trimmed.slice(0, splitIdx).trim();
  const rest = splitIdx === -1 ? "" : trimmed.slice(splitIdx + 2).trim();

  // Plain prefix (no emoji) — Azerbaijani / English
  if (/^Söz sayı:/i.test(first) || /^Word count:/i.test(first)) {
    const isPenalty = /cəza|penalty/i.test(first);
    return {
      wordCountLine: first,
      status: isPenalty ? "penalty" : "ok",
      body: rest,
    };
  }

  return { wordCountLine: null, status: null, body: trimmed };
}

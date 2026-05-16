/** IELTS Listening: merge DB part rows, resolve audio URL, filter questions by part. */

export type ListeningSectionLike = {
  id: string;
  type: string;
  title: string;
  durationMin: number;
  order: number;
  instruction?: string;
  audio?: string | null;
  introduction?: string | null;
  image?: string | null;
  questions: Array<{ id: string; order: number; qtype?: string; prompt?: unknown }>;
};

export function normalizeListeningAudioUrl(
  src: string | null | undefined,
): string | null {
  if (!src || !String(src).trim()) return null;
  const s = String(src).trim();
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:")) {
    return s;
  }
  if (s.startsWith("/audio/")) {
    return `/api/audio/${s.replace(/^\/audio\//, "")}`;
  }
  if (s.startsWith("/api/images/")) {
    const filename = s.replace("/api/images/", "");
    if (/\.(mp3|wav|ogg|m4a|aac|flac|wma|webm)$/i.test(filename)) {
      return `/api/audio/${filename}`;
    }
  }
  if (s.startsWith("/api/audio/")) return s;
  return s;
}

export function resolveSectionAudio(section: ListeningSectionLike): string | null {
  const fromField = section.audio?.trim();
  if (fromField) return normalizeListeningAudioUrl(fromField);

  const firstQ = section.questions?.[0] as { prompt?: { audio?: string } } | undefined;
  const fromPrompt = firstQ?.prompt?.audio;
  if (fromPrompt) return normalizeListeningAudioUrl(fromPrompt);

  return null;
}

export function findListeningAudio(sections: ListeningSectionLike[]): string | null {
  for (const s of sections) {
    const url = resolveSectionAudio(s);
    if (url) return url;
  }
  return null;
}

/** IELTS standard: Q1–10, 11–20, 21–30, 31–40 by global order index. */
export function filterListeningQuestionsByPart<T extends { id: string; order: number }>(
  questions: T[],
  part: number,
): T[] {
  const byOrder = questions
    .filter((q) => {
      if (part === 1) return q.order >= 0 && q.order <= 9;
      if (part === 2) return q.order >= 10 && q.order <= 19;
      if (part === 3) return q.order >= 20 && q.order <= 29;
      if (part === 4) return q.order >= 30 && q.order <= 39;
      return false;
    })
    .sort((a, b) => a.order - b.order);

  if (byOrder.length > 0) return byOrder;

  const prefix = `part${part}`;
  const tagged = questions
    .filter((q) => q.id.toLowerCase().includes(prefix))
    .sort((a, b) => a.order - b.order);
  if (tagged.length > 0) return tagged;

  const totalParts = 4;
  const perPart = Math.ceil(questions.length / totalParts) || 1;
  const start = (part - 1) * perPart;
  return [...questions]
    .sort((a, b) => a.order - b.order)
    .slice(start, start + perPart);
}

const SECTION_ORDER = ["LISTENING", "READING", "WRITING", "SPEAKING"];

function sortExamSections<T extends { type: string; order: number }>(sections: T[]): T[] {
  return [...sections].sort((a, b) => {
    const ai = SECTION_ORDER.indexOf(a.type);
    const bi = SECTION_ORDER.indexOf(b.type);
    if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return a.order - b.order;
  });
}

/** Collapse multiple LISTENING exam_section rows into one runner section. */
export function normalizeIeltsRunnerSections<T extends ListeningSectionLike>(
  raw: T[],
): T[] {
  const listening = raw.filter((s) => s.type === "LISTENING");
  const rest = raw.filter((s) => s.type !== "LISTENING");

  if (listening.length <= 1) {
    return sortExamSections(raw);
  }

  const sortedListening = [...listening].sort((a, b) => a.order - b.order);
  const primary = sortedListening[0];
  const allQuestions = sortedListening
    .flatMap((s) => s.questions || [])
    .sort((a, b) => a.order - b.order);

  const merged = {
    ...primary,
    title: "Listening",
    durationMin: Math.max(30, ...sortedListening.map((s) => s.durationMin || 0)),
    order: Math.min(...sortedListening.map((s) => s.order)),
    audio: findListeningAudio(sortedListening),
    introduction:
      sortedListening.find((s) => s.introduction?.trim())?.introduction ?? null,
    questions: allQuestions,
  } as T;

  return sortExamSections([merged, ...rest]);
}

/** Merge saved answers from all listening subsection ids into the primary listening section id. */
export function mergeListeningAnswers(
  loaded: Record<string, Record<string, unknown>>,
  listeningSectionIds: string[],
  savedByType?: Record<string, unknown>,
): Record<string, Record<string, unknown>> {
  if (listeningSectionIds.length <= 1) return loaded;

  const primaryId = listeningSectionIds[0];
  const merged: Record<string, unknown> = {
    ...(savedByType && typeof savedByType === "object" ? savedByType : {}),
  };

  for (const id of listeningSectionIds) {
    Object.assign(merged, loaded[id] || {});
  }

  return {
    ...loaded,
    [primaryId]: merged as Record<string, unknown>,
  };
}

export function getListeningSectionIds(raw: ListeningSectionLike[]): string[] {
  return raw
    .filter((s) => s.type === "LISTENING")
    .sort((a, b) => a.order - b.order)
    .map((s) => s.id);
}

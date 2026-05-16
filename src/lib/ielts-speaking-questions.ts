/** Group IELTS speaking questions by prompt.part (admin-assigned), not add order. */

export type SpeakingQuestion = {
  id: string;
  order: number;
  qtype?: string;
  prompt?: { part?: number; text?: string };
};

export type SpeakingQuestionsByPart = {
  part1: SpeakingQuestion[];
  part2: SpeakingQuestion[];
  part3: SpeakingQuestion[];
};

export function resolveSpeakingPartNumber(q: SpeakingQuestion): 1 | 2 | 3 {
  const fromPrompt = q.prompt?.part;
  if (fromPrompt === 1 || fromPrompt === 2 || fromPrompt === 3) {
    return fromPrompt;
  }

  const id = q.id.toLowerCase();
  if (/part\s*3|part3|task\s*3|task3/.test(id)) return 3;
  if (/part\s*2|part2|task\s*2|task2/.test(id)) return 2;

  const text = (q.prompt?.text || "").toLowerCase();
  if (text.includes("part 3") || text.includes("part3")) return 3;
  if (text.includes("part 2") || text.includes("part2")) return 2;

  return 1;
}

export function groupSpeakingQuestionsByPart(
  questions: SpeakingQuestion[],
): SpeakingQuestionsByPart {
  const part1: SpeakingQuestion[] = [];
  const part2: SpeakingQuestion[] = [];
  const part3: SpeakingQuestion[] = [];

  for (const q of questions) {
    const part = resolveSpeakingPartNumber(q);
    if (part === 2) part2.push(q);
    else if (part === 3) part3.push(q);
    else part1.push(q);
  }

  const byOrder = (a: SpeakingQuestion, b: SpeakingQuestion) => a.order - b.order;
  part1.sort(byOrder);
  part2.sort(byOrder);
  part3.sort(byOrder);

  return { part1, part2, part3 };
}

export function questionsForSpeakingPart(
  grouped: SpeakingQuestionsByPart,
  part: number,
): SpeakingQuestion[] {
  if (part === 2) return grouped.part2;
  if (part === 3) return grouped.part3;
  return grouped.part1;
}

import type { Section, Question } from "@/components/admin/exams/create/types";
import type { GenericExamBuilderInitial } from "@/components/admin/exams/create/GenericExamBuilder";
import { parseSectionInstruction } from "@/lib/exam-display-utils";

function mapDbQuestion(q: {
  id: string;
  qtype: Question["qtype"];
  order: number;
  prompt: unknown;
  options?: unknown;
  answerKey: unknown;
  maxScore?: number | null;
  explanation?: unknown;
  image?: string | null;
}): Question {
  const prompt =
    q.prompt && typeof q.prompt === "object"
      ? q.prompt
      : { text: q.prompt || "" };
  const promptObj = prompt as Record<string, unknown>;
  const image =
    (promptObj.imageUrl as string | undefined) ||
    (promptObj.image as string | undefined) ||
    q.image ||
    undefined;

  return {
    id: q.id,
    qtype: q.qtype,
    order: q.order,
    prompt,
    options: q.options,
    answerKey: q.answerKey,
    maxScore: q.maxScore ?? 1,
    explanation: q.explanation,
    image,
  } as Question;
}

export function buildGenericExamInitial(exam: {
  title?: string | null;
  track?: string | null;
  durationMin?: number | null;
  sections?: Array<{
    id: string;
    type: Section["type"];
    title: string;
    instruction: unknown;
    durationMin: number;
    order: number;
    image?: string | null;
    questions?: Parameters<typeof mapDbQuestion>[0][];
  }>;
}): GenericExamBuilderInitial {
  const sections: Section[] = (exam.sections || []).map((s) => {
    const instr = parseSectionInstruction(s.instruction);
    const section: Section = {
      id: s.id,
      type: s.type,
      title: s.title,
      instruction: instr.text || "",
      durationMin: s.durationMin,
      order: s.order,
      questions: (s.questions || []).map(mapDbQuestion),
    };

    if (typeof instr.passage === "string" && instr.passage) {
      section.passage = instr.passage;
    }
    if (instr.audio) section.audio = instr.audio as string;
    if (instr.introduction) section.introduction = instr.introduction as string;
    if (s.image || instr.image) {
      section.image = (s.image || instr.image) as string;
    }
    return section;
  });

  return {
    title: exam.title || "",
    track: exam.track || "",
    durationMin: exam.durationMin ?? null,
    sections,
  };
}

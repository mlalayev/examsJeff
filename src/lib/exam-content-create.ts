import { prisma } from "@/lib/prisma";
import { validateIELTSListeningUniqueness, sortIELTSSections } from "@/components/admin/exams/create/constants";

type SectionInput = {
  id?: string;
  type: string;
  title: string;
  instruction?: string | null;
  image?: string | null;
  image2?: string | null;
  parentSectionId?: string | null;
  parentTitle?: string | null;
  parentOrder?: number | null;
  durationMin: number;
  order: number;
  questions?: Array<{
    id?: string;
    qtype: string;
    order: number;
    prompt: unknown;
    options?: unknown;
    answerKey: unknown;
    maxScore: number;
    explanation?: unknown;
    image?: string | null;
  }>;
};

export type CreateExamContentInput = {
  title: string;
  category: string;
  track?: string | null;
  readingType?: string | null;
  writingType?: string | null;
  durationMin?: number | null;
  isActive?: boolean;
  isHomework?: boolean;
  homeworkSubject?: string | null;
  sections?: SectionInput[];
  createdById: string;
};

function mapQuestionCreate(q: NonNullable<SectionInput["questions"]>[number]) {
  return {
    ...(q.id ? { id: q.id } : {}),
    qtype: q.qtype as never,
    order: q.order,
    prompt: {
      ...(typeof q.prompt === "object" && q.prompt !== null ? q.prompt : { text: q.prompt }),
      ...(q.image ? { imageUrl: q.image } : {}),
    },
    options: q.options,
    answerKey: q.answerKey,
    maxScore: q.maxScore,
    explanation: q.explanation,
  };
}

export async function createExamContent(input: CreateExamContentInput) {
  let sections = input.sections ?? [];

  if (input.category === "IELTS" && sections.length > 0) {
    const validation = validateIELTSListeningUniqueness(sections as never);
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid IELTS sections");
    }
    sections = sortIELTSSections(sections as never) as SectionInput[];
  }

  const subsections = sections.filter((s) => s.parentTitle);
  const regularSections = sections.filter((s) => !s.parentTitle);

  const exam = await prisma.exam.create({
    data: {
      title: input.title,
      category: input.category as never,
      track: input.track ?? null,
      readingType: input.readingType,
      writingType: input.writingType,
      durationMin: input.durationMin ?? null,
      isActive: input.isActive ?? true,
      isHomework: input.isHomework ?? false,
      homeworkSubject: input.homeworkSubject ?? null,
      createdById: input.createdById,
      sections: {
        create: regularSections.map((section) => ({
          type: section.type as never,
          title: section.title,
          instruction: section.instruction || null,
          image: section.image || null,
          image2: section.image2 || null,
          durationMin: section.durationMin,
          order: Number(section.order),
          questions: {
            create: (section.questions || []).map(mapQuestionCreate),
          },
        })) as never,
      },
    },
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      sections: { include: { questions: true } },
    },
  });

  if (subsections.length === 0) {
    return exam;
  }

  const subsectionsByParent = new Map<string, SectionInput[]>();
  for (const subsection of subsections) {
    const key = `${subsection.parentTitle}-${subsection.parentOrder}`;
    if (!subsectionsByParent.has(key)) subsectionsByParent.set(key, []);
    subsectionsByParent.get(key)!.push(subsection);
  }

  for (const subs of subsectionsByParent.values()) {
    const firstSub = subs[0];
    const parentSection = await prisma.examSection.create({
      data: {
        examId: exam.id,
        type: firstSub.type as never,
        title: firstSub.parentTitle || "Listening",
        instruction: firstSub.instruction || "{}",
        durationMin: firstSub.durationMin,
        order: firstSub.parentOrder || 0,
      },
    });

    for (const subsection of subs) {
      await prisma.examSection.create({
        data: {
          examId: exam.id,
          type: subsection.type as never,
          title: subsection.title,
          instruction: subsection.instruction || "{}",
          image: subsection.image || null,
          image2: subsection.image2 || null,
          parentSectionId: parentSection.id,
          durationMin: subsection.durationMin,
          order: subsection.order,
          questions: {
            create: (subsection.questions || []).map(mapQuestionCreate) as never,
          },
        },
      });
    }
  }

  return prisma.exam.findUniqueOrThrow({
    where: { id: exam.id },
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      sections: { include: { questions: true }, orderBy: { order: "asc" } },
    },
  });
}

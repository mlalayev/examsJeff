import type { PrismaClient } from "@prisma/client";

/** Fixed title so the seed is idempotent and easy to find in admin. */
export const SAT_DIGITAL_SAMPLE_EXAM_TITLE =
  "SAT Digital — Sample (internal QA)";

export type SeedSatSampleResult = {
  examId: string;
  action: "created" | "existed" | "replaced";
  message: string;
};

/**
 * Creates the SAT Digital sample exam (Verbal 1 → Verbal 2 → Break → Math 1 → Math 2).
 * - If an exam with the same title exists and has bookings: returns that id (no write).
 * - If it exists with zero bookings and replaceIfSafe: deletes and recreates.
 * - If it exists with zero bookings and !replaceIfSafe: returns that id (no write).
 */
export async function seedSatDigitalSample(
  prisma: PrismaClient,
  options?: { replaceIfSafe?: boolean }
): Promise<SeedSatSampleResult> {
  const replaceIfSafe = options?.replaceIfSafe === true;

  const existing = await prisma.exam.findFirst({
    where: { title: SAT_DIGITAL_SAMPLE_EXAM_TITLE },
    include: { _count: { select: { bookings: true } } },
  });

  if (existing) {
    if (existing._count.bookings > 0) {
      return {
        examId: existing.id,
        action: "existed",
        message:
          "Sample exam already exists and has bookings; left unchanged. Assign students from admin as needed.",
      };
    }
    if (!replaceIfSafe) {
      return {
        examId: existing.id,
        action: "existed",
        message:
          "Sample exam already exists (no bookings). Pass replaceIfSafe to recreate, or delete it in admin first.",
      };
    }
    await prisma.exam.delete({ where: { id: existing.id } });
  }

  const passage1 =
    "The reconstruction of Notre Dame Cathedral after the 2019 fire offered a rare opportunity: the _______ of centuries-old timber frames from the nave could be documented and improved using modern engineering.";

  const passage2 =
    "Many historians agree that a fair account of an era requires careful attention to primary sources, yet students sometimes _______ anecdotal evidence with verified fact.";

  const passageMath1 = "If 2x + 5 = 19, what is the value of x?";

  const passageMath2 =
    "A circle has radius 4. What is its area? (Use π as 3.14 in your reasoning.)";

  const exam = await prisma.exam.create({
    data: {
      title: SAT_DIGITAL_SAMPLE_EXAM_TITLE,
      category: "SAT",
      isActive: true,
      sections: {
        create: [
          {
            type: "READING",
            title: "Verbal Module 1",
            order: 0,
            durationMin: 32,
            instruction: { text: "", passage: passage1 },
            questions: {
              create: [
                {
                  qtype: "MCQ_SINGLE",
                  order: 0,
                  maxScore: 1,
                  prompt: {
                    text: "Which choice completes the text with the most logical and precise word or phrase?",
                  },
                  options: {
                    choices: [
                      "deterioration",
                      "migration",
                      "recession",
                      "resurfacing",
                    ],
                  },
                  answerKey: { index: 0 },
                },
                {
                  qtype: "MCQ_SINGLE",
                  order: 1,
                  maxScore: 1,
                  prompt: {
                    text: "The passage is best described as:",
                  },
                  options: {
                    choices: [
                      "skeptical",
                      "informative and measured",
                      "indifferent",
                      "satirical",
                    ],
                  },
                  answerKey: { index: 1 },
                },
              ],
            },
          },
          {
            type: "LISTENING",
            title: "Verbal Module 2",
            order: 1,
            durationMin: 32,
            instruction: { text: "", passage: passage2 },
            questions: {
              create: [
                {
                  qtype: "MCQ_SINGLE",
                  order: 0,
                  maxScore: 1,
                  prompt: {
                    text: "Which choice completes the text with the most logical and precise word or phrase?",
                  },
                  options: {
                    choices: ["confuse", "conflate", "align", "replace"],
                  },
                  answerKey: { index: 1 },
                },
              ],
            },
          },
          {
            type: "SPEAKING",
            title: "Break",
            order: 2,
            durationMin: 10,
            instruction: {
              text: "Take a 10-minute break. Do not access study materials or discuss the exam.",
              passage: null,
            },
            questions: { create: [] },
          },
          {
            type: "GRAMMAR",
            title: "Math Module 1",
            order: 3,
            durationMin: 35,
            instruction: { text: "", passage: passageMath1 },
            questions: {
              create: [
                {
                  qtype: "MCQ_SINGLE",
                  order: 0,
                  maxScore: 1,
                  prompt: { text: "Select the correct answer." },
                  options: { choices: ["5", "6", "7", "8"] },
                  answerKey: { index: 2 },
                },
              ],
            },
          },
          {
            type: "VOCABULARY",
            title: "Math Module 2",
            order: 4,
            durationMin: 35,
            instruction: { text: "", passage: passageMath2 },
            questions: {
              create: [
                {
                  qtype: "MCQ_SINGLE",
                  order: 0,
                  maxScore: 1,
                  prompt: { text: "Choose the best answer." },
                  options: {
                    choices: ["12.56", "50.24", "25.12", "100.48"],
                  },
                  answerKey: { index: 1 },
                },
              ],
            },
          },
        ],
      },
    },
  });

  const replaced = Boolean(existing) && replaceIfSafe;
  return {
    examId: exam.id,
    action: replaced ? "replaced" : "created",
    message: replaced
      ? "Sample exam recreated (previous had no bookings)."
      : "Sample exam created. Assign it to a student, then open My Exams → Start (SAT opens the Digital runner).",
  };
}

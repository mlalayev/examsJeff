import { z } from "zod";
import { HOMEWORK_SUBJECTS, ENGLISH_LEVELS } from "@/lib/homework-subjects";

const subjectIds = HOMEWORK_SUBJECTS.map((s) => s.id) as [string, ...string[]];
const levelIds = ENGLISH_LEVELS.map((l) => l.id) as [string, ...string[]];

export const homeworkQuestionSchema = z.object({
  id: z.string().optional(),
  qtype: z.enum([
    "MCQ",
    "ORDER",
    "DND_MATCH",
    "TF",
    "TF_NG",
    "MCQ_SINGLE",
    "MCQ_MULTI",
    "SELECT",
    "GAP",
    "ORDER_SENTENCE",
    "DND_GAP",
    "SHORT_TEXT",
    "ESSAY",
    "INLINE_SELECT",
    "FILL_IN_BLANK",
    "SPEAKING_RECORDING",
    "IMAGE_INTERACTIVE",
    "HTML_CSS",
  ]),
  order: z.number(),
  prompt: z.any(),
  options: z.any().optional(),
  answerKey: z.any(),
  maxScore: z.number().default(1),
  explanation: z.any().optional(),
  image: z.string().nullable().optional(),
});

export const homeworkSectionSchema = z.object({
  id: z.string().optional(),
  type: z.enum([
    "READING",
    "LISTENING",
    "WRITING",
    "SPEAKING",
    "GRAMMAR",
    "VOCABULARY",
  ]),
  title: z.string(),
  instruction: z.string(),
  image: z.string().nullable().optional(),
  image2: z.string().nullable().optional(),
  parentSectionId: z.string().nullable().optional(),
  parentTitle: z.string().nullable().optional(),
  parentOrder: z.number().nullable().optional(),
  durationMin: z.number(),
  order: z.number(),
  questions: z.array(homeworkQuestionSchema).optional(),
});

export const createHomeworkTemplateSchema = z
  .object({
    title: z.string().min(1).max(200),
    category: z.enum([
      "IELTS",
      "TOEFL",
      "SAT",
      "GENERAL_ENGLISH",
      "MATH",
      "KIDS",
    ]),
    homeworkSubject: z.enum(subjectIds),
    track: z.string().nullable().optional(),
    durationMin: z.number().nullable().optional(),
    isActive: z.boolean().default(true),
    sections: z.array(homeworkSectionSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.homeworkSubject === "GENERAL_ENGLISH") {
      if (!data.track?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "English level is required for General English homework",
          path: ["track"],
        });
        return;
      }
      if (!levelIds.includes(data.track as (typeof levelIds)[number])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid English level",
          path: ["track"],
        });
      }
    }
  });

export const assignHomeworkSchema = z.object({
  examId: z.string().min(1),
  studentIds: z.array(z.string().min(1)).min(1),
  classId: z.string().optional(),
  startAt: z.string().datetime().optional(),
  dueAt: z.string().datetime().optional(),
  isExtra: z.boolean().optional().default(false),
});

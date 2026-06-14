import { z } from "zod";

// Shared validation rules for the Teacher Schedule Dashboard feature.

// Class name is required (non-empty, trimmed, bounded length).
export const classNameSchema = z
  .string()
  .trim()
  .min(1, "Class name is required")
  .max(100, "Class name is too long");

// Student name is required (full name preferred, single names allowed).
export const studentFullNameSchema = z
  .string()
  .trim()
  .min(2, "Student name is required")
  .max(120, "Student name is too long");

// A valid student email is required.
export const studentEmailSchema = z
  .string()
  .trim()
  .min(1, "Student email is required")
  .email("Please enter a valid student email");

// Time of day in 24h HH:MM format.
export const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:MM format");

// Schedule type is required and must be one of the two recurring patterns.
export const scheduleTypeSchema = z.enum(["ODD_DAYS", "EVEN_DAYS"]);

export type ScheduleType = z.infer<typeof scheduleTypeSchema>;

export const toDayType = (t: ScheduleType): "ODD" | "EVEN" =>
  t === "ODD_DAYS" ? "ODD" : "EVEN";

// Creating a recurring schedule: class + type + start/end time, end after start.
export const createScheduleSchema = z
  .object({
    classId: z.string().min(1, "Class is required"),
    scheduleType: scheduleTypeSchema,
    startTime: timeOfDaySchema,
    endTime: timeOfDaySchema,
  })
  .refine((d) => d.endTime > d.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;

// Adding a student to a class: full name + valid email.
export const addStudentSchema = z.object({
  studentName: studentFullNameSchema,
  studentEmail: studentEmailSchema,
});

// Lesson type is a fixed set of class categories.
export const lessonTypeSchema = z.enum([
  "IELTS",
  "TOEFL",
  "SAT",
  "KIDS",
  "GENERAL_ENGLISH",
  "MATH",
  "IT",
  "SPEAKING",
]);

export type LessonType = z.infer<typeof lessonTypeSchema>;

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  IELTS: "IELTS",
  TOEFL: "TOEFL",
  SAT: "SAT",
  KIDS: "Kids",
  GENERAL_ENGLISH: "General English",
  MATH: "Math",
  IT: "IT",
  SPEAKING: "Speaking",
};

export const LESSON_TYPE_OPTIONS = (
  Object.keys(LESSON_TYPE_LABELS) as LessonType[]
).map((value) => ({ value, label: LESSON_TYPE_LABELS[value] }));

// One student row in the inline roster (linked by existing email).
export const rosterStudentSchema = z.object({
  name: z.string().trim().min(1, "Student name is required"),
  email: studentEmailSchema,
});

// Create a class + recurring schedule + (optionally) its student roster in one go.
export const createClassWithScheduleSchema = z
  .object({
    lessonType: lessonTypeSchema,
    scheduleType: scheduleTypeSchema,
    startTime: timeOfDaySchema,
    endTime: timeOfDaySchema,
    students: z.array(rosterStudentSchema).max(200).optional().default([]),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type CreateClassWithScheduleInput = z.infer<
  typeof createClassWithScheduleSchema
>;

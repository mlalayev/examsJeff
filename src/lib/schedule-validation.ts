import { z } from "zod";

// Shared validation rules for the Teacher Schedule Dashboard feature.

// Class name is required (non-empty, trimmed, bounded length).
export const classNameSchema = z
  .string()
  .trim()
  .min(1, "Class name is required")
  .max(100, "Class name is too long");

// Student full name is required and must include first + last name.
export const studentFullNameSchema = z
  .string()
  .trim()
  .min(2, "Student full name is required")
  .regex(/\s/, "Please enter the student's full name (first and last name)");

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

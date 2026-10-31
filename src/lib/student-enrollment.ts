import { z } from "zod";
import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { STUDY_TYPES } from "./study-types";
import { dueDateFor } from "./class-payments";

const subjectLabels = new Map(STUDY_TYPES.map(subject => [subject.id, subject.label]));
export const teacherAssignmentsSchema = z.array(z.object({
  teacherId: z.string().min(1),
  subjects: z.array(z.string().refine(id => subjectLabels.has(id), "Unknown subject")).min(1)
    .refine(ids => ids.length === new Set(ids).size, "Duplicate subject"),
  monthlyFee: z.number().min(0).max(99999999.99).multipleOf(0.01),
})).max(20).refine(rows => rows.length === new Set(rows.map(row => row.teacherId)).size, "Use one row per teacher").default([]);

export class EnrollmentError extends Error {}

export async function enrollStudent(tx: Prisma.TransactionClient, studentId: string, role: string, branchId: string | null,
  assignments: z.infer<typeof teacherAssignmentsSchema>, paymentDate?: string | null) {
  if (!assignments.length) return;
  if (role !== "STUDENT" || !branchId) throw new EnrollmentError("Teacher assignments require a student and a branch.");
  const teachers = await tx.user.count({where:{id:{in:assignments.map(row => row.teacherId)}, role:"TEACHER", approved:true, branchId}});
  if (teachers !== assignments.length) throw new EnrollmentError("Choose approved teachers from the student's branch.");
  const today = new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Baku",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const [year,month] = today.split("-").map(Number);
  const day = paymentDate ? Number(paymentDate.slice(8,10)) : 10;
  if (!Number.isInteger(day) || day < 1 || day > 31) throw new EnrollmentError("Invalid payment day.");
  for (const row of assignments) {
    // Same teacher and subject package shares a roster. Scheduled classes keep their own IDs.
    const subjects = [...row.subjects].sort();
    const classId = "enrollment-" + createHash("sha256").update(JSON.stringify([branchId,row.teacherId,subjects])).digest("hex");
    await tx.class.upsert({where:{id:classId},update:{},create:{id:classId,teacherId:row.teacherId,branchId,name:subjects.map(id=>subjectLabels.get(id)).join(" + ")}});
    await tx.classStudent.create({data:{classId,studentId,monthlyFee:row.monthlyFee,paymentDueDay:day}});
    await tx.classMonthlyPayment.create({data:{classId,studentId,teacherId:row.teacherId,year,month,expected:row.monthlyFee,paid:0,dueDate:dueDateFor(year,month,day)}});
  }
}

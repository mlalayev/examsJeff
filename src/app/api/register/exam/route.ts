import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { preparePasswordForStorage } from "@/lib/user-password";
import {
  findFirstExamForCategory,
  resolveSundayExaminerBranchId,
  studyTypesForExamCategory,
  SUNDAY_EXAMINER_TAG,
} from "@/lib/sunday-examiner";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date of birth"),
  phoneNumber: z
    .string()
    .min(7, "Mobile number must be at least 7 characters")
    .max(20, "Mobile number is too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  examCategory: z.enum(["IELTS", "SAT"], {
    errorMap: () => ({ message: "Please select IELTS or SAT" }),
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const email = data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const branchId = await resolveSundayExaminerBranchId(prisma);
    const exam = await findFirstExamForCategory(prisma, data.examCategory);
    if (!exam) {
      return NextResponse.json(
        {
          error: `No active ${data.examCategory} exam is available yet. Please contact support.`,
        },
        { status: 503 }
      );
    }
    if (exam.sections.length === 0) {
      return NextResponse.json(
        { error: "The selected exam has no sections configured yet." },
        { status: 503 }
      );
    }

    const { passwordHash, passwordEncrypted } = await preparePasswordForStorage(
      data.password
    );
    const examSections = exam.sections.map((s) => s.type);
    const startAt = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email,
          passwordHash,
          passwordEncrypted,
          role: "STUDENT",
          approved: true,
          branchId,
          tags: [SUNDAY_EXAMINER_TAG],
          studentProfile: {
            create: {
              branchId,
              phoneNumber: data.phoneNumber.trim(),
              dateOfBirth: new Date(data.dateOfBirth),
              studentKind: "EXAM_TAKER",
              studyStatus: "CONTINUES",
              studyTypes: studyTypesForExamCategory(data.examCategory),
              program: data.examCategory,
            },
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      const booking = await tx.booking.create({
        data: {
          studentId: user.id,
          examId: exam.id,
          sections: examSections,
          startAt,
          status: "CONFIRMED",
          branchId,
        },
        select: {
          id: true,
          examId: true,
        },
      });

      return { user, booking, examTitle: exam.title };
    });

    return NextResponse.json(
      {
        message: "Registration successful",
        user: result.user,
        booking: result.booking,
        exam: {
          id: exam.id,
          title: result.examTitle,
          category: data.examCategory,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Exam registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}

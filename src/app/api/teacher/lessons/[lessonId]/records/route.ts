import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const recordSchema = z.object({
  studentId: z.string().min(1, "studentId is required"),
  attendance: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]).optional(),
  lateMinutes: z.number().int().min(0).max(600).optional(),
  performance: z
    .enum(["EXCELLENT", "GOOD", "AVERAGE", "WEAK", "DID_NOT_PARTICIPATE"])
    .optional()
    .nullable(),
  homeworkStatus: z
    .enum(["NOT_ASSIGNED", "ASSIGNED", "COMPLETED", "INCOMPLETE", "NOT_DONE"])
    .optional(),
  feedback: z.string().max(4000).optional().nullable(),
  teacherNote: z.string().max(4000).optional().nullable(),
  behaviorNote: z.string().max(4000).optional().nullable(),
});

const saveSchema = z.object({
  // Optional lesson-level topic saved alongside the per-student records.
  topic: z.string().max(500).optional().nullable(),
  records: z.array(recordSchema).min(1, "At least one record is required"),
});

// GET /api/teacher/lessons/[lessonId]/records - List records for a lesson
export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const user = await requireTeacher();
    const { lessonId } = await params;

    const lesson = await prisma.lessonSession.findFirst({
      where: { id: lessonId, teacherId: (user as any).id },
      select: { id: true },
    });
    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found or you don't have permission to view it" },
        { status: 404 }
      );
    }

    const records = await prisma.lessonStudentRecord.findMany({
      where: { lessonSessionId: lessonId },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ records });
  } catch (error) {
    return handleApiError(error, "List lesson records error");
  }
}

// POST /api/teacher/lessons/[lessonId]/records - Save attendance + feedback
// Upserts one record per student (unique on lessonSessionId + studentId), so
// repeated saves edit the same row. Feedback is linked to
// student + lesson + class + teacher for later parent access.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const user = await requireTeacher();
    const { lessonId } = await params;
    const body = await request.json();
    const { topic, records } = saveSchema.parse(body);

    // Ownership: lesson must belong to this teacher
    const lesson = await prisma.lessonSession.findFirst({
      where: { id: lessonId, teacherId: (user as any).id },
      select: { id: true, classId: true, teacherId: true, date: true },
    });
    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found or you don't have permission to modify it" },
        { status: 404 }
      );
    }

    // Feedback must be connected to teacher + class + date + lesson + student.
    // teacher/lesson/date are guaranteed above; the class link is required too.
    if (!lesson.classId) {
      return NextResponse.json(
        { error: "Feedback requires the lesson to be linked to a class" },
        { status: 400 }
      );
    }

    // Validate all referenced students exist and are students
    const studentIds = [...new Set(records.map((r) => r.studentId))];
    const students = await prisma.user.findMany({
      where: { id: { in: studentIds }, role: "STUDENT" },
      select: { id: true },
    });
    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { error: "One or more students were not found" },
        { status: 400 }
      );
    }

    const saved = await prisma.$transaction([
      // Persist the lesson-level topic when provided
      ...(topic !== undefined
        ? [
            prisma.lessonSession.update({
              where: { id: lessonId },
              data: { topic },
            }),
          ]
        : []),
      ...records.map((r) =>
        prisma.lessonStudentRecord.upsert({
          where: {
            lessonSessionId_studentId: {
              lessonSessionId: lessonId,
              studentId: r.studentId,
            },
          },
          create: {
            lessonSessionId: lessonId,
            studentId: r.studentId,
            classId: lesson.classId,
            teacherId: lesson.teacherId,
            attendance: r.attendance ?? "PRESENT",
            lateMinutes: r.lateMinutes ?? 0,
            performance: r.performance ?? null,
            homeworkStatus: r.homeworkStatus ?? "NOT_ASSIGNED",
            feedback: r.feedback ?? null,
            teacherNote: r.teacherNote ?? null,
            behaviorNote: r.behaviorNote ?? null,
          },
          update: {
            ...(r.attendance !== undefined ? { attendance: r.attendance } : {}),
            ...(r.lateMinutes !== undefined ? { lateMinutes: r.lateMinutes } : {}),
            ...(r.performance !== undefined ? { performance: r.performance } : {}),
            ...(r.homeworkStatus !== undefined
              ? { homeworkStatus: r.homeworkStatus }
              : {}),
            ...(r.feedback !== undefined ? { feedback: r.feedback } : {}),
            ...(r.teacherNote !== undefined ? { teacherNote: r.teacherNote } : {}),
            ...(r.behaviorNote !== undefined
              ? { behaviorNote: r.behaviorNote }
              : {}),
          },
        })
      ),
    ]);

    return NextResponse.json({
      message: "Records saved",
      count: records.length,
      results: saved.length,
    });
  } catch (error) {
    return handleApiError(error, "Save lesson records error");
  }
}

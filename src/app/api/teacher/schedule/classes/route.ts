import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";
import {
  createClassWithScheduleSchema,
  LESSON_TYPE_LABELS,
  toDayType,
} from "@/lib/schedule-validation";

// POST /api/teacher/schedule/classes
// Creates a class (named after its lesson type), links existing students by
// email, and creates the recurring odd/even schedule slot - all atomically.
export async function POST(request: Request) {
  try {
    const user = await requireTeacher();
    if ((user as any).role === "TEACHER" && !(user as any).approved) {
      return NextResponse.json({ error: "Approval required" }, { status: 403 });
    }

    const body = await request.json();
    const data = createClassWithScheduleSchema.parse(body);

    // Resolve student emails to existing STUDENT accounts (no account creation).
    const emails = Array.from(
      new Set(data.students.map((s) => s.email.toLowerCase()))
    );

    let studentIds: string[] = [];
    if (emails.length > 0) {
      const found = await prisma.user.findMany({
        where: { email: { in: emails } },
        select: { id: true, email: true, role: true },
      });

      const byEmail = new Map(found.map((u) => [u.email.toLowerCase(), u]));

      const notFound: string[] = [];
      const notStudent: string[] = [];
      for (const email of emails) {
        const u = byEmail.get(email);
        if (!u) notFound.push(email);
        else if (u.role !== "STUDENT") notStudent.push(email);
      }

      if (notFound.length > 0) {
        return NextResponse.json(
          {
            error: `No student account found for: ${notFound.join(", ")}`,
          },
          { status: 404 }
        );
      }
      if (notStudent.length > 0) {
        return NextResponse.json(
          {
            error: `These users are not students: ${notStudent.join(", ")}`,
          },
          { status: 400 }
        );
      }

      studentIds = found.map((u) => u.id);
    }

    const className = LESSON_TYPE_LABELS[data.lessonType];
    const teacherId = (user as any).id;
    const branchId = (user as any).branchId ?? null;

    const result = await prisma.$transaction(async (tx) => {
      const createdClass = await tx.class.create({
        data: { name: className, teacherId, branchId },
      });

      if (studentIds.length > 0) {
        await tx.classStudent.createMany({
          data: studentIds.map((studentId) => ({
            classId: createdClass.id,
            studentId,
          })),
          skipDuplicates: true,
        });
      }

      const slot = await tx.scheduleSlot.create({
        data: {
          teacherId,
          branchId,
          dayType: toDayType(data.scheduleType),
          title: className,
          timeSlot: `${data.startTime} - ${data.endTime}`,
          classId: createdClass.id,
        },
        include: { class: { select: { id: true, name: true } } },
      });

      return { class: createdClass, slot };
    });

    return NextResponse.json(
      {
        message: "Class and schedule created",
        class: result.class,
        slot: result.slot,
        studentsAdded: studentIds.length,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "Create class with schedule error");
  }
}

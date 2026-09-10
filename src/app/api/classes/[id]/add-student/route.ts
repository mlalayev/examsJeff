import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { classAccessWhere } from "@/lib/class-access";
import { z } from "zod";
import { addStudentSchema } from "@/lib/schedule-validation";

// POST /api/classes/[id]/add-student
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireTeacher();
    const body = await request.json();
    const validatedData = addStudentSchema.parse(body);
    const { id: classId } = await params;

    const classExists = await prisma.class.findFirst({
      where: {
        id: classId,
        ...classAccessWhere({
          id: (user as any).id,
          role: (user as any).role,
          branchId: (user as any).branchId,
        }),
      },
    });

    if (!classExists) {
      return NextResponse.json(
        { error: "Class not found or you don't have permission to modify it" },
        { status: 404 }
      );
    }

    const student = await prisma.user.findUnique({
      where: { email: validatedData.studentEmail },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found with this email" },
        { status: 404 }
      );
    }

    if (student.role !== "STUDENT") {
      return NextResponse.json(
        { error: "User must have STUDENT role" },
        { status: 400 }
      );
    }

    try {
      const created = await prisma.classStudent.create({
        data: {
          classId,
          studentId: student.id,
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      const classStudent = {
        ...created,
        student: {
          id: created.student.id,
          email: created.student.email,
          name:
            [created.student.firstName, created.student.lastName]
              .filter(Boolean)
              .join(" ")
              .trim() || null,
        },
      };

      return NextResponse.json(
        {
          message: "Student added successfully",
          classStudent,
        },
        { status: 201 }
      );
    } catch (error: any) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Student is already enrolled in this class" },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.startsWith("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    console.error("Add student error:", error);
    return NextResponse.json(
      { error: "An error occurred while adding the student" },
      { status: 500 }
    );
  }
}

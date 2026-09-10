import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { classAccessWhere, isClassManagerRole } from "@/lib/class-access";
import { z } from "zod";

const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100, "Class name is too long"),
  teacherId: z.string().min(1).optional(),
});

// POST /api/classes - Create a new class
export async function POST(request: Request) {
  try {
    const user = await requireTeacher();
    if ((user as any).role === "TEACHER" && !(user as any).approved) {
      return NextResponse.json({ error: "Approval required" }, { status: 403 });
    }
    const body = await request.json();
    const validatedData = createClassSchema.parse(body);

    let teacherId = (user as any).id as string;
    if (validatedData.teacherId && isClassManagerRole((user as any).role)) {
      const teacher = await prisma.user.findFirst({
        where: {
          id: validatedData.teacherId,
          role: { in: ["TEACHER", "ADMIN", "BOSS", "CREATOR", "BRANCH_ADMIN"] },
        },
        select: { id: true, branchId: true },
      });
      if (!teacher) {
        return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
      }
      teacherId = teacher.id;
    }

    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { branchId: true },
    });

    const newClass = await prisma.class.create({
      data: {
        name: validatedData.name,
        teacherId,
        branchId: teacher?.branchId ?? (user as any).branchId ?? null,
      },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: {
          select: { classStudents: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Class created successfully",
        class: newClass,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
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

    console.error("Create class error:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the class" },
      { status: 500 }
    );
  }
}

// GET /api/classes - List classes (own for teachers; all for CREATOR/ADMIN/BOSS)
export async function GET() {
  try {
    const user = await requireTeacher();
    if ((user as any).role === "TEACHER" && !(user as any).approved) {
      return NextResponse.json({ error: "Approval required" }, { status: 403 });
    }

    const classes = await prisma.class.findMany({
      where: classAccessWhere({
        id: (user as any).id,
        role: (user as any).role,
        branchId: (user as any).branchId,
      }),
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: {
          select: { classStudents: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ classes });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.startsWith("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    console.error("List classes error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching classes" },
      { status: 500 }
    );
  }
}

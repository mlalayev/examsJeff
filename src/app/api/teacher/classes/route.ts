import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";

export async function GET() {
  try {
    const user = await requireTeacher();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher's classes with students
    const classes = await prisma.class.findMany({
      where: {
        teacherId: user.id,
      },
      include: {
        classStudents: {
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
        },
        _count: {
          select: {
            classStudents: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const response = classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      studentCount: cls._count.classStudents,
      students: cls.classStudents.map((s) => ({
        id: s.student.id,
        name:
          [s.student.firstName, s.student.lastName].filter(Boolean).join(" ").trim() ||
          s.student.email?.split("@")[0] ||
          "Unknown",
        email: s.student.email,
      })),
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Teacher classes API error:", error);
    return NextResponse.json(
      { error: "Failed to load classes" },
      { status: 500 }
    );
  }
}

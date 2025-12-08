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
        students: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
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
      studentCount: cls._count.students,
      students: cls.students.map(s => ({
        id: s.user.id,
        name: s.user.name || s.user.email?.split('@')[0] || "Unknown",
        email: s.user.email,
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

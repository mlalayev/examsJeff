import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher, requireAdminOrBranchAdmin } from "@/lib/auth-utils";

export async function GET(request: Request) {
  try {
    await requireTeacher();

    const exams = await prisma.exam.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        isActive: true,
        createdAt: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    return NextResponse.json({ exams });
  } catch (error) {
    console.error("Exams list error:", error);
    return NextResponse.json({ error: "Failed to list exams" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdminOrBranchAdmin();
    const body = await request.json();

    const title = (body?.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const exam = await prisma.exam.create({
      data: {
        title,
        category: "IELTS", // default; can be changed later in edit UI
        isActive: true,
        createdById: (user as any).id,
      },
    });

    return NextResponse.json({ exam });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Admin or Branch Admin access required" }, { status: 403 });
    }
    console.error("Create exam error:", error);
    return NextResponse.json({ error: "Failed to create exam" }, { status: 500 });
  }
}


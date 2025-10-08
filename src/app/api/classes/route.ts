import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { z } from "zod";

const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100, "Class name is too long"),
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
    
    const newClass = await prisma.class.create({
      data: {
        name: validatedData.name,
        teacherId: (user as any).id,
        branchId: (user as any).branchId ?? null,
      },
      include: {
        _count: {
          select: { classStudents: true }
        }
      }
    });
    
    return NextResponse.json({
      message: "Class created successfully",
      class: newClass
    }, { status: 201 });
    
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

// GET /api/classes - List teacher's classes
export async function GET() {
  try {
    const user = await requireTeacher();
    if ((user as any).role === "TEACHER" && !(user as any).approved) {
      return NextResponse.json({ error: "Approval required" }, { status: 403 });
    }
    
    const classes = await prisma.class.findMany({
      where: {
        teacherId: (user as any).id,
        // Branch scoping implicitly applied by teacherId; if we later allow BRANCH_ADMIN listing, add branchId filter there
      },
      include: {
        _count: {
          select: { classStudents: true }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
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


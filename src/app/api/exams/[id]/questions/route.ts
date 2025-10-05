import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";

// GET /api/exams/[id]/questions?section=READING
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireTeacher();
    
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section");
    
    const where: any = {
      examId: params.id,
    };
    
    if (section) {
      where.sectionType = section;
    }
    
    const questions = await prisma.question.findMany({
      where,
      orderBy: {
        order: "asc"
      }
    });
    
    return NextResponse.json({ questions });
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.startsWith("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    console.error("Fetch questions error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching questions" },
      { status: 500 }
    );
  }
}


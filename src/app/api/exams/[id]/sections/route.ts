import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";

// GET /api/exams/[id]/sections - Get exam sections
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireTeacher();
    
    const sections = await prisma.examSection.findMany({
      where: {
        examId: params.id,
      },
      orderBy: {
        order: "asc"
      }
    });
    
    return NextResponse.json({ sections });
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.startsWith("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    console.error("Fetch sections error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching sections" },
      { status: 500 }
    );
  }
}


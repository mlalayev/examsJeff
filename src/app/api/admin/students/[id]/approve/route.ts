import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { approved } = body;

    if (typeof approved !== "boolean") {
      return NextResponse.json(
        { error: "approved must be a boolean" },
        { status: 400 }
      );
    }

    const student = await prisma.user.findUnique({
      where: { id }
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    if (student.role !== "STUDENT") {
      return NextResponse.json(
        { error: "User is not a student" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id },
      data: { approved }
    });

    return NextResponse.json({
      success: true,
      message: approved ? "Student approved" : "Student approval revoked"
    });
  } catch (error) {
    console.error("Error updating student approval:", error);
    return NextResponse.json(
      { error: "Failed to update approval status" },
      { status: 500 }
    );
  }
}


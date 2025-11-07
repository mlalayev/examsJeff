import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

export async function GET(request: Request) {
  try {
    const user = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const approved = searchParams.get("approved");

    const where: any = {
      role: "STUDENT"
    };

    if (approved !== null) {
      where.approved = approved === "true";
    }

    const students = await prisma.user.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}


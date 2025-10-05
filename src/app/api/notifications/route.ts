import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/notifications - Fetch user's notifications
export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const notifications = await prisma.notification.findMany({
      where: {
        userId: (user as any).id,
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit,
    });

    return NextResponse.json({ notifications });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    console.error("Fetch notifications error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching notifications" },
      { status: 500 }
    );
  }
}


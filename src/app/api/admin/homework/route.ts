import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrBoss, getScopedBranchId } from "@/lib/auth-utils";
import {
  assignmentHomeworkSelect,
  mapAssignmentHomeworkRow,
} from "@/lib/homework-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdminOrBoss();
    const branchId = getScopedBranchId(user);

    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || "regular").toLowerCase();
    const isExtra = type === "extras";
    const search = searchParams.get("search")?.trim() || "";

    const where: Record<string, unknown> = { isExtra };

    if (branchId) {
      where.OR = [{ branchId }, { student: { branchId } }];
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { student: { firstName: { contains: search, mode: "insensitive" } } },
            { student: { lastName: { contains: search, mode: "insensitive" } } },
            { student: { email: { contains: search, mode: "insensitive" } } },
            {
              unitExam: {
                exam: { title: { contains: search, mode: "insensitive" } },
              },
            },
            {
              exam: { title: { contains: search, mode: "insensitive" } },
            },
          ],
        },
      ];
    }

    const items = await prisma.assignment.findMany({
      where,
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      select: assignmentHomeworkSelect,
    });

    return NextResponse.json({
      items: items.map(mapAssignmentHomeworkRow),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load homework";
    const status = /Unauthorized|Forbidden/.test(message) ? 403 : 500;
    console.error("Admin homework list error:", error);
    return NextResponse.json({ error: message }, { status });
  }
}

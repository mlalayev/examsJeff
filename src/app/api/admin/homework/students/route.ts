import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getScopedBranchId } from "@/lib/auth-utils";
import { requireHomeworkManager, isTeacherRole } from "@/lib/homework-access";
import { formatUserName } from "@/lib/homework-utils";

export const dynamic = "force-dynamic";

/** Students available for homework assignment (admin / boss / creator). */
export async function GET(request: NextRequest) {
  try {
    const user = await requireHomeworkManager();
    const role = (user as { role: string }).role;

    if (isTeacherRole(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const branchId = getScopedBranchId(user);
    const search = request.nextUrl.searchParams.get("search")?.trim() || "";

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        ...(branchId ? { branchId } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take: 500,
    });

    return NextResponse.json({
      students: students.map((s) => ({
        id: s.id,
        name: formatUserName(s) || s.email,
        email: s.email,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load students";
    const status = /Unauthorized|Forbidden/.test(message) ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

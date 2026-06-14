import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher, getScopedBranchId } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";

// GET /api/teacher/students/search?q=farah
// Returns existing STUDENT accounts matching the query by first/last name or
// email, so a teacher can pick them when building a class roster.
export async function GET(request: Request) {
  try {
    const user = await requireTeacher();
    const branchId = getScopedBranchId(user);
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();

    if (q.length < 2) {
      return NextResponse.json({ students: [] });
    }

    const where: Record<string, unknown> = {
      role: "STUDENT",
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    };
    if (branchId) where.branchId = branchId;

    const found = await prisma.user.findMany({
      where,
      select: { id: true, firstName: true, lastName: true, email: true },
      take: 15,
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    const students = found.map((s) => ({
      id: s.id,
      email: s.email,
      name:
        [s.firstName, s.lastName].filter(Boolean).join(" ").trim() || s.email,
    }));

    return NextResponse.json({ students });
  } catch (error) {
    return handleApiError(error, "Search students error");
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

// GET /api/admin/users?role=...&search=...
export async function GET(request: Request) {
  try {
    const current = await requireAdmin();
    
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get("role");
    const search = searchParams.get("search");
    const currentRole = (current as any).role as string;
    const currentBranchId = (current as any).branchId as string | null | undefined;
    
    const users = await prisma.user.findMany({
      where: {
        ...(roleFilter && { role: roleFilter as any }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } }
          ]
        }),
        // If admin is BRANCH_ADMIN, scope to same branch only
        ...(currentRole === "BRANCH_ADMIN" && currentBranchId
          ? { branchId: currentBranchId }
          : {})
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true,
        branchId: true,
        createdAt: true,
        _count: {
          select: {
            classesTeaching: true,
            classEnrollments: true,
            bookingsAsStudent: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    
    return NextResponse.json({ users });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}


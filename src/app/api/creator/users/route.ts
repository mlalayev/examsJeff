import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/creator/users - List all users (including CREATOR for CREATOR role)
export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const role = (user as any).role;

    // Only CREATOR can access this endpoint
    if (role !== "CREATOR") {
      return NextResponse.json({ error: "Forbidden: CREATOR access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const roleFilter = searchParams.get("role");

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ];
    }

    if (roleFilter && roleFilter !== "ALL") {
      where.role = roleFilter;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true,
        branchId: true,
        createdAt: true,
        branch: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 500
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}



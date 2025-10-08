import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/branches - public (used by registration form)
export async function GET() {
  const branches = await prisma.branch.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true }
  });
  return NextResponse.json({ branches });
}

// POST /api/branches - BOSS only (seed/create branches)
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const role = (user as any).role;
    if (role !== "BOSS") {
      return NextResponse.json({ error: "Boss access required" }, { status: 403 });
    }

    const body = await request.json();
    const name = (body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const branch = await prisma.branch.create({ data: { name } });
    return NextResponse.json({ branch }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}



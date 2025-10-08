import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBoss } from "@/lib/auth-utils";
import { z } from "zod";

// GET /api/admin/branches (BOSS-only)
export async function GET() {
  try {
    await requireBoss();
    const branches = await prisma.branch.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ branches });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

// POST /api/admin/branches (BOSS-only)
const schema = z.object({ name: z.string().min(1) });
export async function POST(request: Request) {
  try {
    await requireBoss();
    const body = await request.json();
    const { name } = schema.parse(body);
    const branch = await prisma.branch.create({ data: { name } });
    return NextResponse.json({ branch }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Validation error" }, { status: 400 });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}



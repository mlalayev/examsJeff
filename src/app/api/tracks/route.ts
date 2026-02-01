import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

// GET /api/tracks - list all tracks
export async function GET() {
  const tracks = await prisma.track.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ tracks });
}

// POST /api/tracks/seed - create default General English tracks (BOSS/ADMIN only)
export async function POST() {
  try {
    await requireAdmin();
    const names = ["A1", "A2", "B1", "B1+", "B2", "C1", "C2"];
    const ops = names.map((name) =>
      prisma.track.upsert({
        where: { name },
        create: { name },
        update: {},
      })
    );
    const created = await prisma.$transaction(ops);
    return NextResponse.json({ tracks: created }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}



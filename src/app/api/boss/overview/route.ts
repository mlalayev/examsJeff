import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBoss } from "@/lib/auth-utils";

// GET /api/boss/overview - global KPIs
export async function GET() {
  try {
    await requireBoss();

    const [branches, users, classes, bookings, attempts] = await Promise.all([
      prisma.branch.count(),
      prisma.user.count(),
      prisma.class.count(),
      prisma.booking.count(),
      prisma.attempt.count(),
    ]);

    const recentBookings = await prisma.booking.findMany({
      orderBy: { startAt: "desc" },
      take: 10,
      include: {
        student: { select: { id: true, name: true, email: true } },
        exam: { select: { id: true, title: true } },
        teacher: { select: { id: true, name: true } },
      },
    });

    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, email: true, role: true, createdAt: true, branchId: true },
    });

    return NextResponse.json({
      kpis: { branches, users, classes, bookings, attempts },
      recentBookings,
      recentUsers,
    });
  } catch (e) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}



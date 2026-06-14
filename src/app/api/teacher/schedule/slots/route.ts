import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";
import { createScheduleSchema, toDayType } from "@/lib/schedule-validation";

// GET /api/teacher/schedule/slots - List the teacher's recurring odd/even slots
export async function GET(request: Request) {
  try {
    const user = await requireTeacher();
    const { searchParams } = new URL(request.url);
    const dayType = searchParams.get("dayType");

    const slots = await prisma.scheduleSlot.findMany({
      where: {
        teacherId: (user as any).id,
        ...(dayType === "ODD" || dayType === "EVEN" ? { dayType } : {}),
      },
      include: {
        class: { select: { id: true, name: true } },
      },
      orderBy: [{ dayType: "asc" }, { timeSlot: "asc" }],
    });

    return NextResponse.json({ slots });
  } catch (error) {
    return handleApiError(error, "List schedule slots error");
  }
}

// POST /api/teacher/schedule/slots - Create a recurring odd/even slot
export async function POST(request: Request) {
  try {
    const user = await requireTeacher();
    const body = await request.json();
    const data = createScheduleSchema.parse(body);

    // The class must exist and belong to this teacher
    const owned = await prisma.class.findFirst({
      where: { id: data.classId, teacherId: (user as any).id },
      select: { id: true, name: true },
    });
    if (!owned) {
      return NextResponse.json(
        { error: "Class not found or you don't have permission to use it" },
        { status: 404 }
      );
    }

    const slot = await prisma.scheduleSlot.create({
      data: {
        teacherId: (user as any).id,
        branchId: (user as any).branchId ?? null,
        dayType: toDayType(data.scheduleType),
        title: owned.name,
        timeSlot: `${data.startTime} - ${data.endTime}`,
        classId: owned.id,
      },
      include: {
        class: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { message: "Schedule slot created", slot },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "Create schedule slot error");
  }
}

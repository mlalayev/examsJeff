import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";

export async function GET() {
  try {
    const user = await requireTeacher();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { teacherId: user.id },
      select: { schedule: true },
    });

    return NextResponse.json({
      schedule: teacherProfile?.schedule || { oddDays: [], evenDays: [] },
    });
  } catch (error) {
    console.error("Teacher schedule GET error:", error);
    return NextResponse.json(
      { error: "Failed to load schedule" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireTeacher();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schedule } = await request.json();

    if (!schedule || !schedule.oddDays || !schedule.evenDays) {
      return NextResponse.json(
        { error: "Invalid schedule format" },
        { status: 400 }
      );
    }

    // Find or create teacher profile
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { teacherId: user.id },
    });

    if (teacherProfile) {
      // Update existing profile
      await prisma.teacherProfile.update({
        where: { teacherId: user.id },
        data: { schedule },
      });
    } else {
      // Create new profile with schedule
      await prisma.teacherProfile.create({
        data: {
          teacherId: user.id,
          phoneNumber: "", // Required field, will be empty for now
          schedule,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Schedule saved successfully",
    });
  } catch (error) {
    console.error("Teacher schedule POST error:", error);
    return NextResponse.json(
      { error: "Failed to save schedule" },
      { status: 500 }
    );
  }
}

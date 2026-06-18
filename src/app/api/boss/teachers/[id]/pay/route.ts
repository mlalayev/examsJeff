import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBoss } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const paySchema = z.object({
  payType: z.enum(["PER_LESSON", "HOURLY", "FIXED"]),
  rate: z.coerce.number().min(0).nullable().optional(),
  fixedAmount: z.coerce.number().min(0).nullable().optional(),
});

// GET /api/boss/teachers/[id]/pay
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireBoss();
    const { id } = await params;

    const teacher = await prisma.user.findFirst({
      where: { id, role: "TEACHER" },
      select: { id: true },
    });
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const pay = await prisma.teacherPaySetting.findUnique({
      where: { teacherId: id },
    });

    return NextResponse.json({
      payType: pay?.payType ?? "PER_LESSON",
      rate: pay?.rate != null ? Number(pay.rate) : null,
      fixedAmount: pay?.fixedAmount != null ? Number(pay.fixedAmount) : null,
    });
  } catch (error) {
    return handleApiError(error, "Get teacher pay error");
  }
}

// PUT /api/boss/teachers/[id]/pay
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireBoss();
    const { id } = await params;
    const body = paySchema.parse(await request.json());

    const teacher = await prisma.user.findFirst({
      where: { id, role: "TEACHER" },
      select: { id: true },
    });
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const pay = await prisma.teacherPaySetting.upsert({
      where: { teacherId: id },
      create: {
        teacherId: id,
        payType: body.payType,
        rate: body.rate ?? null,
        fixedAmount: body.fixedAmount ?? null,
      },
      update: {
        payType: body.payType,
        rate: body.rate ?? null,
        fixedAmount: body.fixedAmount ?? null,
      },
    });

    return NextResponse.json({
      payType: pay.payType,
      rate: pay.rate != null ? Number(pay.rate) : null,
      fixedAmount: pay.fixedAmount != null ? Number(pay.fixedAmount) : null,
    });
  } catch (error) {
    return handleApiError(error, "Update teacher pay error");
  }
}

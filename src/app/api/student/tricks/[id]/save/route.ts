import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

/** POST = save, DELETE = unsave. Idempotent on both sides. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireStudent();
    const studentId = (user as any).id as string;
    const { id: trickId } = await params;

    const trick = await prisma.trick.findFirst({
      where: { id: trickId, isPublished: true },
      select: { id: true },
    });
    if (!trick) {
      return NextResponse.json({ error: "Trick not found" }, { status: 404 });
    }

    await prisma.trickSave.upsert({
      where: { trickId_studentId: { trickId, studentId } },
      update: {},
      create: { trickId, studentId },
    });

    return NextResponse.json({ saved: true });
  } catch (error: any) {
    const status = /Unauthorized|Forbidden/.test(error?.message ?? "") ? 401 : 500;
    console.error("Trick save error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to save trick" },
      { status }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireStudent();
    const studentId = (user as any).id as string;
    const { id: trickId } = await params;

    await prisma.trickSave.deleteMany({ where: { trickId, studentId } });

    return NextResponse.json({ saved: false });
  } catch (error: any) {
    const status = /Unauthorized|Forbidden/.test(error?.message ?? "") ? 401 : 500;
    console.error("Trick unsave error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to unsave trick" },
      { status }
    );
  }
}

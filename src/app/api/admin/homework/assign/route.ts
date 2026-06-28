import { NextResponse } from "next/server";
import { z } from "zod";
import { requireHomeworkManager } from "@/lib/homework-access";
import { assignHomeworkSchema } from "@/lib/homework-schemas";
import { assignHomeworkToStudents } from "@/lib/homework-assign";

export async function POST(request: Request) {
  try {
    const user = await requireHomeworkManager();
    const body = await request.json();
    const data = assignHomeworkSchema.parse(body);

    const result = await assignHomeworkToStudents(data, {
      userId: (user as { id: string }).id,
      role: (user as { role: string }).role,
      branchId: (user as { branchId?: string | null }).branchId ?? null,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to assign homework";
    const status = /Unauthorized|Forbidden/.test(message) ? 403 : 500;
    console.error("Assign homework error:", error);
    return NextResponse.json({ error: message }, { status });
  }
}

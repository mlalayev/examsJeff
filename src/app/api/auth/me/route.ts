import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";

export async function GET() {
  try {
    const user = await requireAuth();
    return NextResponse.json({
      id: (user as any).id,
      email: (user as any).email,
      name: (user as any).name,
      role: (user as any).role,
      branchId: (user as any).branchId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
}


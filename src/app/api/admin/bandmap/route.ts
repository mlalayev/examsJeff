import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { z } from "zod";

const bandMapSchema = z.object({
  examType: z.string(),
  section: z.enum(["READING", "LISTENING", "WRITING", "SPEAKING"]),
  minRaw: z.number().int().min(0),
  maxRaw: z.number().int().min(0),
  band: z.number().min(0).max(9),
}).refine(data => data.maxRaw >= data.minRaw, {
  message: "maxRaw must be >= minRaw"
});

// GET /api/admin/bandmap
export async function GET() {
  try {
    await requireAdmin();
    
    const bandMaps = await prisma.bandMap.findMany({
      orderBy: [
        { examType: "asc" },
        { section: "asc" },
        { minRaw: "asc" }
      ]
    });
    
    return NextResponse.json({ bandMaps });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

// POST /api/admin/bandmap
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    
    const validatedData = bandMapSchema.parse(body);
    
    const bandMap = await prisma.bandMap.create({
      data: validatedData
    });
    
    return NextResponse.json({ bandMap }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

// DELETE /api/admin/bandmap (expects ?id=xxx)
export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    
    await prisma.bandMap.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: "BandMap deleted" });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}


import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { z } from "zod";

const bandMapSchema = z.object({
  examType: z.string(),
  section: z.enum(["READING", "LISTENING", "WRITING", "SPEAKING"]),
  minRaw: z.number().int().min(0),
  maxRaw: z.number().int().min(0),
  band: z.number().min(0).max(9),
});

const importSchema = z.object({
  items: z.array(bandMapSchema).min(1, "At least one band mapping is required"),
});

// POST /api/bands/import - Bulk import band mappings
export async function POST(request: Request) {
  try {
    await requireTeacher();
    const body = await request.json();
    
    const validatedData = importSchema.parse(body);
    
    // Bulk create band mappings
    const bands = await prisma.bandMap.createMany({
      data: validatedData.items,
    });
    
    return NextResponse.json({
      message: `Successfully imported ${bands.count} band mappings`,
      count: bands.count
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message, details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.startsWith("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    console.error("Import bands error:", error);
    return NextResponse.json(
      { error: "An error occurred while importing band mappings" },
      { status: 500 }
    );
  }
}


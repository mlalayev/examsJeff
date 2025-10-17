import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/catalog/ge-levels
 * Returns available General English levels
 */
export async function GET(req: NextRequest) {
  try {
    const levels = ["A1", "A2", "B1", "B1+", "B2"];
    
    return NextResponse.json({ levels });
  } catch (error: any) {
    console.error("Error fetching GE levels:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch levels" },
      { status: 500 }
    );
  }
}


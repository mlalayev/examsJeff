import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    // Await params in Next.js 15+
    const params = await context.params;
    const filename = params.filename;

    // Security: prevent directory traversal
    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      console.error("Invalid filename:", filename);
      return new NextResponse("Invalid filename", { status: 400 });
    }
    
    const filePath = join(process.cwd(), "public", "images", filename);

    // Check if file exists
    if (!existsSync(filePath)) {
      console.error("Image not found:", filePath);
      return new NextResponse("Image not found", { status: 404 });
    }
    
    // Read and serve the file
    const fileBuffer = await readFile(filePath);

    // Determine content type based on extension
    const ext = filename.split('.').pop()?.toLowerCase();
    const contentType = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    }[ext || ''] || 'application/octet-stream';
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error("Error serving image:", error);
    return new NextResponse(`Internal server error: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
  }
}

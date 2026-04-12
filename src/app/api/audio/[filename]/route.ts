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
    
    console.log("Serving audio:", filename);
    
    // Security: prevent directory traversal
    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      console.error("Invalid filename:", filename);
      return new NextResponse("Invalid filename", { status: 400 });
    }
    
    const filePath = join(process.cwd(), "public", "audio", filename);
    console.log("Audio file path:", filePath);
    
    // Check if file exists
    if (!existsSync(filePath)) {
      console.error("Audio not found:", filePath);
      return new NextResponse("Audio not found", { status: 404 });
    }
    
    // Read and serve the file
    const fileBuffer = await readFile(filePath);
    console.log("Audio file read successfully, size:", fileBuffer.length);
    
    // Determine content type based on extension
    const ext = filename.split('.').pop()?.toLowerCase();
    const contentType = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'm4a': 'audio/mp4',
      'aac': 'audio/aac',
      'flac': 'audio/flac',
      'wma': 'audio/x-ms-wma',
      'webm': 'audio/webm',
    }[ext || ''] || 'application/octet-stream';
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error) {
    console.error("Error serving audio:", error);
    return new NextResponse(`Internal server error: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
  }
}

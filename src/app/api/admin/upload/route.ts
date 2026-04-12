import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { requireAdminOrBranchAdmin } from "@/lib/auth-utils";
import { applyRateLimit } from "@/lib/rate-limiter-enhanced";
import { validateFileUpload, createErrorResponse } from "@/lib/security";

// Configure route segment for large file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout

// Maximum file sizes from environment
const MAX_AUDIO_SIZE = parseInt(process.env.MAX_AUDIO_FILE_SIZE_BYTES || "52428800"); // 50MB
const MAX_IMAGE_SIZE = parseInt(process.env.MAX_IMAGE_FILE_SIZE_BYTES || "5242880"); // 5MB

const ALLOWED_AUDIO_EXTENSIONS = (process.env.ALLOWED_AUDIO_EXTENSIONS || "mp3,wav,ogg,m4a,aac,flac,wma,webm").split(",");
const ALLOWED_IMAGE_EXTENSIONS = (process.env.ALLOWED_IMAGE_EXTENSIONS || "jpg,jpeg,png,gif,webp").split(",");

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await applyRateLimit(request, "UPLOAD");
    if (rateLimitResult) return rateLimitResult;

    // Authentication check
    await requireAdminOrBranchAdmin();
    
    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error("Failed to parse formData:", error);
      return NextResponse.json({ 
        error: "Failed to parse upload. File may be too large. Maximum size is 50MB for audio files." 
      }, { status: 413 });
    }
    
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    if (!type || (type !== "audio" && type !== "image")) {
      return NextResponse.json({ error: "Invalid type. Must be 'audio' or 'image'" }, { status: 400 });
    }
    
    // Validate file based on type
    const maxSize = type === "audio" ? MAX_AUDIO_SIZE : MAX_IMAGE_SIZE;
    const allowedExtensions = type === "audio" ? ALLOWED_AUDIO_EXTENSIONS : ALLOWED_IMAGE_EXTENSIONS;
    
    const validation = validateFileUpload(file, allowedExtensions, maxSize);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate secure filename (prevent directory traversal)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
    const filename = `${timestamp}-${randomStr}.${ext}`;
    
    // Determine upload directory
    const uploadDir = type === "audio" ? "public/audio" : "public/images";
    const filePath = join(process.cwd(), uploadDir, filename);
    
    // Create directory if it doesn't exist
    try {
      await mkdir(join(process.cwd(), uploadDir), { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    // Write file
    await writeFile(filePath, buffer);
    
    // Return API path that will definitely work
    // Use /api/images/[filename] or /api/audio/[filename] route instead of /images/ or /audio/
    const apiPath = type === "audio" ? `/api/audio/${filename}` : `/api/images/${filename}`;
    const publicPath = `/${uploadDir.replace('public/', '')}/${filename}`;
    
    console.log("File saved to:", filePath);
    console.log("API path:", apiPath);
    console.log("Public path:", publicPath);
    
    return NextResponse.json({ 
      success: true,
      path: apiPath, // Use API route for reliable serving
      publicPath: publicPath, // Keep public path as fallback
      filename: filename 
    });
    
  } catch (error) {
    return createErrorResponse(error, 500);
  }
}


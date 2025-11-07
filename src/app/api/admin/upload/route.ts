import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { requireAdminOrBranchAdmin } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    await requireAdminOrBranchAdmin();
    
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // "audio" or "image"
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    if (!type || (type !== "audio" && type !== "image")) {
      return NextResponse.json({ error: "Invalid type. Must be 'audio' or 'image'" }, { status: 400 });
    }
    
    // Validate file type
    if (type === "audio") {
      if (!file.name.toLowerCase().endsWith('.mp3') && !file.type.includes('audio')) {
        return NextResponse.json({ error: "Only MP3 audio files are allowed" }, { status: 400 });
      }
    } else if (type === "image") {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
      }
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const ext = file.name.split('.').pop();
    const filename = `${timestamp}-${randomStr}.${ext}`;
    
    // Determine upload directory
    const uploadDir = type === "audio" ? "public/audio" : "public/images";
    const filePath = join(process.cwd(), uploadDir, filename);
    
    // Create directory if it doesn't exist
    try {
      await mkdir(join(process.cwd(), uploadDir), { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
    
    // Write file
    await writeFile(filePath, buffer);
    
    // Return public path
    const publicPath = `/${uploadDir.replace('public/', '')}/${filename}`;
    
    return NextResponse.json({ 
      success: true,
      path: publicPath,
      filename: filename 
    });
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message.startsWith("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}


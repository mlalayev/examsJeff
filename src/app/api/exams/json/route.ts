import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import fs from "fs/promises";
import path from "path";

// GET /api/exams/json - List all available JSON-based exams
export async function GET() {
  try {
    await requireAuth();
    
    const examsDir = path.join(process.cwd(), "src", "data", "exams");
    const exams: any[] = [];
    
    // Scan directory structure
    const categories = await fs.readdir(examsDir, { withFileTypes: true });
    
    for (const category of categories) {
      if (!category.isDirectory()) continue;
      
      const categoryPath = path.join(examsDir, category.name);
      const tracks = await fs.readdir(categoryPath, { withFileTypes: true });
      
      for (const track of tracks) {
        if (!track.isDirectory()) continue;
        
        const trackPath = path.join(categoryPath, track.name);
        const units = await fs.readdir(trackPath, { withFileTypes: true });
        
        for (const unit of units) {
          if (!unit.isDirectory()) continue;
          
          const examPath = path.join(trackPath, unit.name, "exam.json");
          
          try {
            const examData = await fs.readFile(examPath, "utf-8");
            const exam = JSON.parse(examData);
            
            exams.push({
              id: exam.id,
              title: exam.title,
              category: exam.category || category.name.toUpperCase().replace(/-/g, "_"),
              track: exam.track || track.name.toUpperCase(),
              unit: exam.unit || unit.name,
              totalPoints: exam.totalPoints || 0,
              path: `${category.name}/${track.name}/${unit.name}`,
              isActive: true,
            });
          } catch (err) {
            // Skip if exam.json doesn't exist or is malformed
            console.warn(`Skipping ${examPath}:`, err);
          }
        }
      }
    }
    
    return NextResponse.json({ exams });
  } catch (error) {
    console.error("JSON exams list error:", error);
    return NextResponse.json({ error: "Failed to list exams" }, { status: 500 });
  }
}


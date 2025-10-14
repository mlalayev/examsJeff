import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    console.log("Test seed starting...");
    
    const user = await requireAuth();
    console.log("User:", user?.email, "Role:", (user as any)?.role);
    
    // Test database connection
    const userCount = await prisma.user.count();
    console.log("Database connected, user count:", userCount);
    
    // Test exam creation with minimal data
    const testExam = await prisma.exam.create({
      data: {
        title: "Test Exam",
        category: "GENERAL_ENGLISH",
        track: "A1",
        isActive: true,
        createdById: user.id,
        sections: {
          create: [
            {
              type: "READING",
              title: "Test Reading",
              durationMin: 5,
              order: 1,
              questions: {
                create: [
                  {
                    qtype: "TF",
                    order: 1,
                    maxScore: 1,
                    prompt: { text: "Test question" },
                    answerKey: { value: true },
                  }
                ]
              }
            }
          ]
        }
      },
      include: {
        sections: {
          include: {
            questions: true
          }
        }
      }
    });
    
    console.log("Test exam created:", testExam.id);
    
    // Clean up
    await prisma.exam.delete({ where: { id: testExam.id } });
    console.log("Test exam deleted");
    
    return NextResponse.json({
      success: true,
      message: "Test completed successfully",
      userCount,
      testExamId: testExam.id
    });
    
  } catch (error) {
    console.error("Test seed error:", error);
    return NextResponse.json(
      { 
        error: "Test failed", 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

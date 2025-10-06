import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";

// GET /api/analytics/teacher/overview?classId=xxx
export async function GET(request: Request) {
  try {
    const user = await requireTeacher();
    const teacherId = (user as any).id;
    
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    
    if (!classId) {
      return NextResponse.json(
        { error: "classId is required" },
        { status: 400 }
      );
    }
    
    // Verify class belongs to teacher
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    
    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }
    
    if (classData.teacherId !== teacherId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // Get students in class
    const classStudents = await prisma.classStudent.findMany({
      where: { classId },
      select: { studentId: true }
    });
    
    const studentIds = classStudents.map(cs => cs.studentId);
    
    if (studentIds.length === 0) {
      return NextResponse.json({
        class: {
          id: classData.id,
          name: classData.name,
          teacher: classData.teacher,
        },
        studentsCount: 0,
        attemptsCount: 0,
        avgOverall: null,
        avgBySection: {
          READING: null,
          LISTENING: null,
          WRITING: null,
          SPEAKING: null,
        },
        trendLastN: [],
        weakTopics: [],
      });
    }
    
    // Get all attempts for students in this class
    const attempts = await prisma.attempt.findMany({
      where: {
        booking: {
          studentId: {
            in: studentIds
          }
        },
        status: "SUBMITTED",
        bandOverall: {
          not: null
        }
      },
      include: {
        sections: true,
        booking: {
          select: {
            studentId: true,
          }
        }
      },
      orderBy: {
        submittedAt: "asc"
      }
    });
    
    const attemptsCount = attempts.length;
    
    // Calculate average overall band
    const avgOverall = attemptsCount > 0
      ? attempts.reduce((sum, a) => sum + (a.bandOverall || 0), 0) / attemptsCount
      : null;
    
    // Calculate average by section
    const avgBySection: Record<string, number | null> = {
      READING: null,
      LISTENING: null,
      WRITING: null,
      SPEAKING: null,
    };
    
    for (const sectionType of ["READING", "LISTENING", "WRITING", "SPEAKING"]) {
      const sectionsOfType = attempts.flatMap(a => 
        a.sections.filter(s => s.type === sectionType && s.bandScore !== null)
      );
      
      if (sectionsOfType.length > 0) {
        avgBySection[sectionType] = 
          sectionsOfType.reduce((sum, s) => sum + (s.bandScore || 0), 0) / sectionsOfType.length;
      }
    }
    
    // Calculate trend (last 8 weeks)
    const trendLastN: Array<{ weekStart: string; avgOverall: number }> = [];
    
    if (attemptsCount > 0) {
      const now = new Date();
      const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
      
      // Group attempts by week
      const weeklyAttempts: Map<string, number[]> = new Map();
      
      attempts
        .filter(a => a.submittedAt && new Date(a.submittedAt) >= eightWeeksAgo)
        .forEach(attempt => {
          if (!attempt.submittedAt) return;
          
          const date = new Date(attempt.submittedAt);
          // Get Monday of that week
          const dayOfWeek = date.getDay();
          const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          const monday = new Date(date.setDate(diff));
          monday.setHours(0, 0, 0, 0);
          
          const weekKey = monday.toISOString().split('T')[0];
          
          if (!weeklyAttempts.has(weekKey)) {
            weeklyAttempts.set(weekKey, []);
          }
          
          if (attempt.bandOverall !== null) {
            weeklyAttempts.get(weekKey)!.push(attempt.bandOverall);
          }
        });
      
      // Calculate average for each week
      weeklyAttempts.forEach((bands, weekStart) => {
        if (bands.length > 0) {
          const avg = bands.reduce((sum, b) => sum + b, 0) / bands.length;
          trendLastN.push({
            weekStart,
            avgOverall: Number(avg.toFixed(1))
          });
        }
      });
      
      // Sort by week
      trendLastN.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
    }
    
    // Calculate weak topics (from Reading/Listening questions)
    const weakTopics: Array<{ tag: string; accuracyPercent: number; attempts: number }> = [];
    
    // Get all Reading/Listening sections for these students
    const rlSections = attempts.flatMap(a => 
      a.sections.filter(s => 
        (s.type === "READING" || s.type === "LISTENING") && 
        s.answers !== null
      )
    );
    
    if (rlSections.length > 0) {
      // Get all questions with tags from exams these students took
      const examIds = Array.from(new Set(
        attempts.map(a => a.booking).map(b => b as any).map(b => b.examId).filter(Boolean)
      ));
      
      if (examIds.length > 0) {
        const questionsWithTags = await prisma.question.findMany({
          where: {
            examId: {
              in: examIds as string[]
            },
            sectionType: {
              in: ["READING", "LISTENING"]
            }
          },
          include: {
            tags: true
          }
        });
        
        // Group by tag and calculate accuracy
        const tagStats: Map<string, { correct: number; total: number }> = new Map();
        
        for (const section of rlSections) {
          const answers = section.answers as any;
          if (!answers) continue;
          
          for (const question of questionsWithTags) {
            if (!question.tags || question.tags.length === 0) continue;
            
            const studentAnswer = answers[question.id];
            if (studentAnswer === undefined) continue;
            
            // Check if answer is correct (simple comparison)
            const answerKey = question.answerKey as any;
            const isCorrect = answerKey && answerKey.correct && 
              String(studentAnswer).toLowerCase().trim() === 
              String(answerKey.correct).toLowerCase().trim();
            
            // Update stats for each tag
            for (const tagObj of question.tags) {
              if (!tagStats.has(tagObj.tag)) {
                tagStats.set(tagObj.tag, { correct: 0, total: 0 });
              }
              
              const stats = tagStats.get(tagObj.tag)!;
              stats.total++;
              if (isCorrect) stats.correct++;
            }
          }
        }
        
        // Convert to array and calculate percentages
        tagStats.forEach((stats, tag) => {
          const accuracyPercent = stats.total > 0 
            ? (stats.correct / stats.total) * 100 
            : 0;
          
          weakTopics.push({
            tag,
            accuracyPercent: Number(accuracyPercent.toFixed(1)),
            attempts: stats.total
          });
        });
        
        // Sort by accuracy (weakest first)
        weakTopics.sort((a, b) => a.accuracyPercent - b.accuracyPercent);
      }
    }
    
    return NextResponse.json({
      class: {
        id: classData.id,
        name: classData.name,
        teacher: classData.teacher,
      },
      studentsCount: studentIds.length,
      attemptsCount,
      avgOverall: avgOverall !== null ? Number(avgOverall.toFixed(1)) : null,
      avgBySection: Object.fromEntries(
        Object.entries(avgBySection).map(([k, v]) => [
          k, 
          v !== null ? Number(v.toFixed(1)) : null
        ])
      ),
      trendLastN,
      weakTopics: weakTopics.slice(0, 10), // Top 10 weakest
    });
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Teachers only" }, { status: 403 });
      }
    }
    
    console.error("Analytics overview error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching analytics" },
      { status: 500 }
    );
  }
}


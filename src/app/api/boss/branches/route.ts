import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { z } from "zod";

const createBranchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
});

// GET /api/boss/branches - Get all branches with statistics
export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const role = (user as any).role;
    
    if (role !== "BOSS") {
      return NextResponse.json({ error: "Forbidden: Boss access required" }, { status: 403 });
    }

    const branches = await prisma.branch.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            classes: true,
            studentProfiles: true,
          },
        },
        users: {
          where: {
            role: { in: ["STUDENT", "TEACHER"] },
          },
          select: {
            id: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate student and teacher counts
    const branchesWithCounts = branches.map(branch => {
      const students = branch.users.filter(u => u.role === "STUDENT").length;
      const teachers = branch.users.filter(u => u.role === "TEACHER").length;
      
      return {
        id: branch.id,
        name: branch.name,
        createdAt: branch.createdAt,
        _count: {
          users: branch._count.users,
          classes: branch._count.classes,
          students,
          teachers,
        },
      };
    });

    return NextResponse.json({ branches: branchesWithCounts });

  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Boss branches error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

// POST /api/boss/branches - Create new branch
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const role = (user as any).role;
    
    if (role !== "BOSS") {
      return NextResponse.json({ error: "Forbidden: Boss access required" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createBranchSchema.parse(body);

    // Check if branch name already exists
    const existing = await prisma.branch.findUnique({
      where: { name: validatedData.name },
    });

    if (existing) {
      return NextResponse.json({ error: "Branch with this name already exists" }, { status: 400 });
    }

    const branch = await prisma.branch.create({
      data: {
        name: validatedData.name,
      },
    });

    return NextResponse.json({ 
      message: "Branch created successfully", 
      branch 
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: error.errors 
      }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Create branch error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

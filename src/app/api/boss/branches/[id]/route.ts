import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBoss } from "@/lib/auth-utils";
import { z } from "zod";

const updateBranchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
});

// PATCH /api/boss/branches/[id] - Update branch
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireBoss();
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateBranchSchema.parse(body);

    // Check if branch exists
    const existing = await prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // Check if new name conflicts with another branch
    const nameConflict = await prisma.branch.findFirst({
      where: {
        name: validatedData.name,
        id: { not: id }
      }
    });

    if (nameConflict) {
      return NextResponse.json({ error: "Branch with this name already exists" }, { status: 400 });
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: { name: validatedData.name }
    });

    return NextResponse.json({ 
      message: "Branch updated successfully", 
      branch 
    });

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
    console.error("Update branch error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

// DELETE /api/boss/branches/[id] - Delete branch
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireBoss();
    const { id } = await params;

    // Check if branch has users
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            classes: true
          }
        }
      }
    });

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    if (branch._count.users > 0 || branch._count.classes > 0) {
      return NextResponse.json(
        { error: `Cannot delete branch with ${branch._count.users} user(s) and ${branch._count.classes} class(es)` },
        { status: 400 }
      );
    }

    await prisma.branch.delete({ where: { id } });

    return NextResponse.json({ message: "Branch deleted successfully" });

  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Delete branch error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}


import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import bcrypt from "bcryptjs";
import { z } from "zod";

const MANAGER_ROLES = ["CREATOR", "ADMIN", "BOSS"];

// GET /api/admin/users/:id - Full account details (incl. profile) for editing
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const current = await requireAuth();
    const currentRole = (current as any).role as string;
    if (!MANAGER_ROLES.includes(currentRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        approved: true,
        branchId: true,
        tags: true,
        createdAt: true,
        studentProfile: {
          select: {
            phoneNumber: true,
            dateOfBirth: true,
            program: true,
            monthlyFee: true,
            studyTypes: true,
            lessonModes: true,
          },
        },
        teacherProfile: {
          select: {
            phoneNumber: true,
            dateOfBirth: true,
            program: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = user.studentProfile ?? user.teacherProfile ?? null;

    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        approved: user.approved,
        branchId: user.branchId,
        tags: user.tags,
        createdAt: user.createdAt,
        profile: profile
          ? {
              phoneNumber: profile.phoneNumber ?? null,
              dateOfBirth: profile.dateOfBirth ?? null,
              program: profile.program ?? null,
              monthlyFee:
                user.studentProfile?.monthlyFee != null
                  ? Number(user.studentProfile.monthlyFee)
                  : null,
              studyTypes: user.studentProfile?.studyTypes ?? [],
              lessonModes: user.studentProfile?.lessonModes ?? [],
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

const updateSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z
    .enum([
      "STUDENT",
      "TEACHER",
      "ADMIN",
      "BOSS",
      "BRANCH_ADMIN",
      "BRANCH_BOSS",
      "PARENT",
      "PARTNER",
    ])
    .optional(),
  branchId: z.string().nullable().optional(),
  approved: z.boolean().optional(),
  profile: z
    .object({
      phoneNumber: z.string().nullable().optional(),
      dateOfBirth: z.string().nullable().optional(),
      program: z.string().nullable().optional(),
      monthlyFee: z.union([z.string(), z.number()]).nullable().optional(),
      studyTypes: z.array(z.string()).optional(),
      lessonModes: z.array(z.string()).optional(),
    })
    .optional(),
});

// PATCH /api/admin/users/:id - Edit any account field (CREATOR/ADMIN/BOSS)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const current = await requireAuth();
    const currentRole = (current as any).role as string;
    if (!MANAGER_ROLES.includes(currentRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, branchId: true },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Protect CREATOR accounts from non-CREATOR edits
    if (target.role === "CREATOR" && currentRole !== "CREATOR") {
      return NextResponse.json(
        { error: "Cannot modify creator account" },
        { status: 403 }
      );
    }

    // Role assignment guard: only BOSS/CREATOR can grant BOSS (zod already
    // prevents assigning CREATOR via this endpoint).
    if (
      data.role === "BOSS" &&
      currentRole !== "BOSS" &&
      currentRole !== "CREATOR"
    ) {
      return NextResponse.json(
        { error: "Only BOSS can assign BOSS role" },
        { status: 403 }
      );
    }

    // Email uniqueness
    if (data.email) {
      const clash = await prisma.user.findFirst({
        where: { email: data.email, id: { not: id } },
        select: { id: true },
      });
      if (clash) {
        return NextResponse.json(
          { error: "Another account already uses this email" },
          { status: 400 }
        );
      }
    }

    const userData: Record<string, unknown> = {};
    if (data.firstName !== undefined) userData.firstName = data.firstName;
    if (data.lastName !== undefined) userData.lastName = data.lastName;
    if (data.email !== undefined) userData.email = data.email;
    if (data.role !== undefined) userData.role = data.role;
    if (data.branchId !== undefined) userData.branchId = data.branchId;
    if (data.approved !== undefined) userData.approved = data.approved;
    if (data.password) userData.passwordHash = await bcrypt.hash(data.password, 10);

    await prisma.user.update({ where: { id }, data: userData });

    const effectiveRole = data.role ?? target.role;
    const effectiveBranchId =
      data.branchId !== undefined ? data.branchId : target.branchId;

    // Sync profile details (shared phone/dob/program, plus student monthlyFee)
    if (data.profile) {
      const p = data.profile;
      const dob =
        p.dateOfBirth !== undefined
          ? p.dateOfBirth
            ? new Date(p.dateOfBirth)
            : null
          : undefined;

      if (effectiveRole === "STUDENT") {
        const fee =
          p.monthlyFee !== undefined
            ? p.monthlyFee === null || p.monthlyFee === ""
              ? null
              : Number(p.monthlyFee)
            : undefined;
        const existing = await prisma.studentProfile.findUnique({
          where: { studentId: id },
        });
        if (existing) {
          await prisma.studentProfile.update({
            where: { studentId: id },
            data: {
              ...(p.phoneNumber !== undefined ? { phoneNumber: p.phoneNumber } : {}),
              ...(dob !== undefined ? { dateOfBirth: dob } : {}),
              ...(p.program !== undefined ? { program: p.program } : {}),
              ...(fee !== undefined ? { monthlyFee: fee } : {}),
              ...(p.studyTypes !== undefined ? { studyTypes: p.studyTypes } : {}),
              ...(p.lessonModes !== undefined ? { lessonModes: p.lessonModes } : {}),
            },
          });
        } else if (effectiveBranchId) {
          await prisma.studentProfile.create({
            data: {
              studentId: id,
              branchId: effectiveBranchId,
              phoneNumber: p.phoneNumber ?? null,
              dateOfBirth: dob ?? null,
              program: p.program ?? null,
              monthlyFee: fee ?? null,
              studyTypes: p.studyTypes ?? [],
              lessonModes: p.lessonModes ?? [],
            },
          });
        }
      } else if (effectiveRole === "TEACHER") {
        const existing = await prisma.teacherProfile.findUnique({
          where: { teacherId: id },
        });
        if (existing) {
          await prisma.teacherProfile.update({
            where: { teacherId: id },
            data: {
              ...(p.phoneNumber !== undefined ? { phoneNumber: p.phoneNumber ?? "" } : {}),
              ...(dob !== undefined ? { dateOfBirth: dob } : {}),
              ...(p.program !== undefined ? { program: p.program } : {}),
            },
          });
        } else {
          await prisma.teacherProfile.create({
            data: {
              teacherId: id,
              phoneNumber: p.phoneNumber ?? "",
              dateOfBirth: dob ?? null,
              program: p.program ?? null,
            },
          });
        }
      }
    }

    return NextResponse.json({ message: "Account updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

// DELETE /api/admin/users/:id - Delete a user (CREATOR/ADMIN/BOSS)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const current = await requireAuth();
    const currentRole = (current as any).role as string;

    if (currentRole !== "CREATOR" && currentRole !== "ADMIN" && currentRole !== "BOSS") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, email: true },
    });

    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Prevent anyone except CREATOR from deleting CREATOR accounts
    if (target.role === "CREATOR" && currentRole !== "CREATOR") {
      return NextResponse.json({ error: "Cannot delete creator account" }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    // Prisma FK constraint errors will surface here
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}


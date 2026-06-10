import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, canCreatePartnerAccount } from "@/lib/auth-utils";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createUserSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN", "PARENT", "PARTNER"]),
  branchId: z.string().nullable(),
  approved: z.boolean().optional(),
  childIds: z.array(z.string().min(1)).optional(),
  tags: z.array(z.string().min(1)).max(20).optional(),
  studentProfile: z
    .object({
      phoneNumber: z.string().optional(),
      dateOfBirth: z.string().nullable().optional(),
      program: z.string().optional(),
      paymentDate: z.string().nullable().optional(),
      paymentAmount: z.string().nullable().optional(),
    })
    .optional(),
});

// POST /api/admin/users/create — ADMIN (most roles) or leadership (PARTNER only)
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const callerRole = (user as any).role;
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    if (callerRole === "CREATOR") {
      return NextResponse.json(
        { error: "Use creator user management for this account" },
        { status: 403 }
      );
    }

    if (validatedData.role === "PARTNER") {
      if (!canCreatePartnerAccount(callerRole)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (callerRole !== "ADMIN" && callerRole !== "BOSS") {
      return NextResponse.json({ error: "Forbidden: ADMIN or BOSS access required" }, { status: 403 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // Validate student-specific requirements
    if (validatedData.role === "STUDENT" && !validatedData.branchId) {
      return NextResponse.json({ error: "Branch is required for students" }, { status: 400 });
    }

    // Validate parent-specific requirements
    if (validatedData.role === "PARENT") {
      const childIds = validatedData.childIds ?? [];
      if (childIds.length === 0) {
        return NextResponse.json({ error: "At least one child is required for parents" }, { status: 400 });
      }

      const children = await prisma.user.findMany({
        where: { id: { in: childIds }, role: "STUDENT" },
        select: { id: true },
      });

      if (children.length !== childIds.length) {
        return NextResponse.json({ error: "One or more selected children are invalid" }, { status: 400 });
      }
    }

    const newUser = await prisma.user.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        passwordHash,
        role: validatedData.role,
        approved: validatedData.role === "PARTNER" ? true : (validatedData.approved ?? true),
        branchId: validatedData.role === "PARTNER" ? null : validatedData.branchId,
        tags: validatedData.tags ?? [],
        ...(validatedData.role === "STUDENT" && validatedData.branchId && validatedData.studentProfile && {
          studentProfile: {
            create: {
              branchId: validatedData.branchId,
              phoneNumber: validatedData.studentProfile.phoneNumber || null,
              dateOfBirth: validatedData.studentProfile.dateOfBirth ? new Date(validatedData.studentProfile.dateOfBirth) : null,
              program: validatedData.studentProfile.program || null,
              paymentDate: validatedData.studentProfile.paymentDate ? new Date(validatedData.studentProfile.paymentDate) : null,
              paymentAmount: validatedData.studentProfile.paymentAmount ? parseFloat(validatedData.studentProfile.paymentAmount) : null,
            }
          }
        }),
        ...(validatedData.role === "PARENT" && {
          childrenAsParent: {
            create: (validatedData.childIds ?? []).map((childId) => ({
              childId,
            })),
          },
        }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        approved: true,
        branchId: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ 
      message: "User created successfully", 
      user: newUser 
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    console.error("Create user error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}


import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  // Admins are only allowed to create STUDENT, TEACHER, and ADMIN accounts
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
  branchId: z.string().nullable(),
  approved: z.boolean().default(false),
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

// POST /api/admin/users/create - Create a user manually (ADMIN only)
export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    const role = (user as any).role;

    // Only ADMIN can access this endpoint
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: ADMIN access required" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

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

    // Create user with student profile if role is STUDENT
    const newUser = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        role: validatedData.role,
        approved: validatedData.approved,
        branchId: validatedData.branchId,
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
        })
      },
      select: {
        id: true,
        name: true,
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
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error("Create user error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}


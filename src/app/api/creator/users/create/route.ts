import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createUserSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN", "BOSS", "BRANCH_ADMIN", "BRANCH_BOSS", "CREATOR", "PARENT"]),
  branchId: z.string().nullable(),
  approved: z.boolean().optional(),
  childIds: z.array(z.string().min(1)).optional(),
  tags: z.array(z.string().min(1)).max(20).optional(),
});

// POST /api/creator/users/create - Create a user manually (CREATOR only)
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const role = (user as any).role;

    // Only CREATOR can access this endpoint
    if (role !== "CREATOR") {
      return NextResponse.json({ error: "Forbidden: CREATOR access required" }, { status: 403 });
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

    // Create user
    const newUser = await prisma.user.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        passwordHash,
        role: validatedData.role,
        approved: true,
        branchId: validatedData.branchId,
        tags: validatedData.tags ?? [],
        ...(validatedData.role === "PARENT" && {
          childrenAsParent: {
            create: (validatedData.childIds ?? []).map((childId) => ({ childId })),
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
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error("Create user error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}



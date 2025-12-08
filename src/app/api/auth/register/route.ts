import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["STUDENT", "TEACHER"], {
    errorMap: () => ({ message: "Role must be STUDENT or TEACHER" })
  }),
  branchId: z.string().min(1, "Branch is required"),
});

// Prevent registration of CREATOR accounts
const RESERVED_EMAILS = ["creator@creator.com"];
const RESERVED_ROLES = ["CREATOR", "ADMIN", "BOSS", "BRANCH_ADMIN", "BRANCH_BOSS"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    
    // Prevent registration with reserved emails
    if (RESERVED_EMAILS.includes(validatedData.email.toLowerCase())) {
      return NextResponse.json(
        { error: "This email is reserved and cannot be used for registration" },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Resolve branch (ensure FK exists; support fallback tokens)
    let branchId = validatedData.branchId;
    let branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      // map known fallback tokens to names
      const fallbackMap: Record<string, string> = {
        "fallback-28may": "28 May",
        "fallback-ahmadli": "Əhmədli",
      };
      const maybeName = fallbackMap[branchId] ?? branchId;
      let byName = await prisma.branch.findFirst({ where: { name: maybeName } });
      if (!byName) {
        // create branch on the fly for known names
        byName = await prisma.branch.create({ data: { name: maybeName } });
      }
      branchId = byName.id;
    }

    // Check if there is any admin/boss user in the system (for bootstrap)
    const adminCount = await prisma.user.count({
      where: { role: { in: ["ADMIN", "BOSS"] } },
    });
    const isBootstrapAdmin = adminCount === 0;

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        role: isBootstrapAdmin ? "ADMIN" : validatedData.role,
        approved: isBootstrapAdmin ? true : false,
        branchId,
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

    return NextResponse.json(
      { 
        message: isBootstrapAdmin
          ? "User registered successfully as bootstrap ADMIN (auto-approved)."
          : "User registered successfully",
        user: {
          ...user,
          role: isBootstrapAdmin ? "ADMIN" : user.role,
          approved: isBootstrapAdmin ? true : user.approved,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}


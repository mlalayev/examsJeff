import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { z } from "zod";

const createAttemptSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
});

// POST /api/attempts - Create attempt from booking
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    
    const validatedData = createAttemptSchema.parse(body);
    
    // Verify booking exists and belongs to this user
    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: {
        exam: {
          include: {
            sections: true
          }
        },
        attempt: true
      }
    });
    
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }
    
    if (booking.studentId !== (user as any).id) {
      return NextResponse.json(
        { error: "This booking does not belong to you" },
        { status: 403 }
      );
    }
    
    // Check if attempt already exists
    if (booking.attempt) {
      return NextResponse.json(
        { error: "Attempt already exists for this booking", attempt: booking.attempt },
        { status: 400 }
      );
    }
    
    // Create attempt with sections based on booking.sections
    const attempt = await prisma.attempt.create({
      data: {
        bookingId: booking.id,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        sections: {
          create: booking.sections.map(sectionType => ({
            type: sectionType,
            status: "NOT_STARTED"
          }))
        }
      },
      include: {
        sections: true,
        booking: {
          include: {
            exam: {
              include: {
                sections: true
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json({
      message: "Attempt created successfully",
      attempt
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    
    console.error("Create attempt error:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the attempt" },
      { status: 500 }
    );
  }
}

// GET /api/attempts?bookingId=xxx - Get attempt by booking
export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");
    
    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId query parameter is required" },
        { status: 400 }
      );
    }
    
    const attempt = await prisma.attempt.findUnique({
      where: { bookingId },
      include: {
        sections: {
          orderBy: {
            type: "asc"
          }
        },
        booking: {
          include: {
            exam: {
              include: {
                sections: {
                  orderBy: {
                    order: "asc"
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!attempt) {
      return NextResponse.json(
        { error: "Attempt not found" },
        { status: 404 }
      );
    }
    
    // Verify ownership
    if (attempt.booking.studentId !== (user as any).id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ attempt });
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    
    console.error("Get attempt error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the attempt" },
      { status: 500 }
    );
  }
}


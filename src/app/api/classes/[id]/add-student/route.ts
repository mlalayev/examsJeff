import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { z } from "zod";

const addStudentSchema = z.object({
  studentEmail: z.string().email("Invalid email address"),
});

// POST /api/classes/[id]/add-student - Add a student to a class
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireTeacher();
    const body = await request.json();
    
    const validatedData = addStudentSchema.parse(body);
    const classId = params.id;
    
    // Verify the class belongs to this teacher
    const classExists = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: (user as any).id,
      }
    });
    
    if (!classExists) {
      return NextResponse.json(
        { error: "Class not found or you don't have permission to modify it" },
        { status: 404 }
      );
    }
    
    // Find the student by email
    const student = await prisma.user.findUnique({
      where: { email: validatedData.studentEmail }
    });
    
    if (!student) {
      return NextResponse.json(
        { error: "Student not found with this email" },
        { status: 404 }
      );
    }
    
    // Verify the user is a student
    if (student.role !== "STUDENT") {
      return NextResponse.json(
        { error: "User must have STUDENT role" },
        { status: 400 }
      );
    }
    
    // Add student to class (unique constraint will prevent duplicates)
    try {
      const classStudent = await prisma.classStudent.create({
        data: {
          classId,
          studentId: student.id,
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });
      
      return NextResponse.json({
        message: "Student added successfully",
        classStudent
      }, { status: 201 });
      
    } catch (error: any) {
      // Handle unique constraint violation
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Student is already enrolled in this class" },
          { status: 400 }
        );
      }
      throw error;
    }
    
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
      if (error.message.startsWith("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    console.error("Add student error:", error);
    return NextResponse.json(
      { error: "An error occurred while adding the student" },
      { status: 500 }
    );
  }
}


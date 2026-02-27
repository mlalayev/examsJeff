import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/creator/users/:id - Get full user details (CREATOR only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const role = (user as any).role;

    // Only CREATOR can access this endpoint
    if (role !== "CREATOR") {
      return NextResponse.json({ error: "Forbidden: CREATOR access required" }, { status: 403 });
    }

    const { id } = await params;

    const [userDetails, attempts] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          approved: true,
          branchId: true,
          createdAt: true,
          updatedAt: true,
          branch: {
            select: { id: true, name: true }
          },
          classEnrollments: {
            select: {
              id: true,
              class: { select: { id: true, name: true, createdAt: true } },
              createdAt: true
            }
          },
          bookingsAsStudent: {
            select: {
              id: true,
              exam: { select: { id: true, title: true, category: true } },
              startAt: true,
              status: true,
              createdAt: true
            },
            orderBy: { createdAt: "desc" },
            take: 10
          },
          enrollments: {
            select: {
              id: true,
              courseName: true,
              courseType: true,
              level: true,
              status: true,
              enrolledAt: true
            }
          },
          payments: {
            select: {
              id: true,
              amount: true,
              dueDate: true,
              paidDate: true,
              status: true
            },
            orderBy: { dueDate: "desc" },
            take: 10
          },
          tuitionPayments: {
            select: {
              id: true,
              year: true,
              month: true,
              amount: true,
              status: true,
              paidAt: true
            },
            orderBy: [{ year: "desc" }, { month: "desc" }],
            take: 12
          },
          studentProfile: {
            select: {
              id: true,
              firstEnrollAt: true,
              monthlyFee: true,
              teacher: { select: { id: true, name: true, email: true } }
            }
          },
          classesTeaching: {
            select: {
              id: true,
              name: true,
              createdAt: true,
              _count: { select: { classStudents: true } }
            }
          },
          examsCreated: {
            select: { id: true, title: true, category: true, createdAt: true },
            take: 10
          },
          assignmentsAsTeacher: {
            select: {
              id: true,
              unitExam: { select: { exam: { select: { title: true } } } },
              student: { select: { name: true, email: true } },
              status: true,
              createdAt: true
            },
            take: 10
          },
          _count: {
            select: {
              classEnrollments: true,
              bookingsAsStudent: true,
              classesTeaching: true,
              examsCreated: true,
              enrollments: true,
              payments: true,
              tuitionPayments: true
            }
          }
        }
      }),
      // attempts has no back-relation on User, query separately
      prisma.attempt.findMany({
        where: { studentId: id },
        select: {
          id: true,
          examId: true,
          status: true,
          bandOverall: true,
          startedAt: true,
          submittedAt: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" },
        take: 10
      })
    ]);

    if (!userDetails) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Enrich attempts with exam titles
    const examIds = [...new Set(attempts.map((a) => a.examId))];
    const exams = examIds.length
      ? await prisma.exam.findMany({
          where: { id: { in: examIds } },
          select: { id: true, title: true }
        })
      : [];
    const examMap = Object.fromEntries(exams.map((e) => [e.id, e.title]));
    const enrichedAttempts = attempts.map((a) => ({
      ...a,
      exam: { title: examMap[a.examId] ?? a.examId }
    }));

    // Attach attempts and count
    const result = {
      ...userDetails,
      attempts: enrichedAttempts,
      _count: {
        ...userDetails._count,
        attempts: await prisma.attempt.count({ where: { studentId: id } })
      }
    };

    return NextResponse.json({ user: result });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json({ error: "Failed to fetch user details" }, { status: 500 });
  }
}



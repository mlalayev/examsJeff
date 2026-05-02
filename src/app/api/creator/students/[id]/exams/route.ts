import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { fetchStudentExamAttemptsForDashboard } from "@/lib/student-exam-attempts-query";

function authErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof Error)) return null;
  if (error.message === "Unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (error.message.startsWith("Forbidden")) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  return null;
}

/**
 * GET /api/creator/students/:id/exams — Same as admin route; CREATOR uses this path from the UI.
 * Authorization: ADMIN, BOSS, CREATOR (see requireAdmin).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id: studentId } = await params;

    const data = await fetchStudentExamAttemptsForDashboard(studentId);
    if (!data) {
      console.warn(`Student not found or not a student role: ${studentId}`);
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    
    console.error("Creator student exams error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    return NextResponse.json(
      { 
        error: "Failed to load student exams",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

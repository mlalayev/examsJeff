import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth-utils";
import { getTeacherStudents } from "@/lib/teacher-students";

export const dynamic = "force-dynamic";

/** Teacher's own students for homework assignment. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireTeacher();
    const teacherId = (user as { id: string }).id;
    const classId = request.nextUrl.searchParams.get("classId")?.trim() || "";
    const search = request.nextUrl.searchParams.get("search")?.trim().toLowerCase() || "";

    let students = await getTeacherStudents(teacherId);

    const allClasses = [
      ...new Map(
        students
          .filter((s) => s.classId && s.className)
          .map((s) => [s.classId!, { id: s.classId!, name: s.className! }])
      ).values(),
    ].sort((a, b) => a.name.localeCompare(b.name));

    if (classId) {
      students = students.filter((s) => s.classId === classId);
    }

    if (search) {
      students = students.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.email.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      students: students.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        className: s.className,
      })),
      classes: allClasses,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load students";
    const status = /Unauthorized|Forbidden/.test(message) ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

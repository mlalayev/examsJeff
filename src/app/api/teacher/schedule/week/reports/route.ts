import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth-utils";
import { handleApiError } from "@/lib/api-helpers";
import { checkRateLimit } from "@/lib/rate-limiter";
import { RATE_LIMITS } from "@/lib/rate-limit-config";
import { handleOpenAIError } from "@/lib/openai-client";
import {
  generateWeeklyReports,
  type ReportTemplateKind,
  type WeeklyReportStudent,
} from "@/lib/weekly-report-ai";
import { LESSON_TYPE_LABELS } from "@/lib/schedule-validation";
import { z } from "zod";

export const maxDuration = 60;

const bodySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "start must be YYYY-MM-DD"),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "end must be YYYY-MM-DD"),
});

function toUtc(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// Map the stored class name (= LESSON_TYPE_LABELS[...]) to a report template.
// Speaking classes intentionally return null (no reports). English-family
// lessons (English/Kids/IELTS/TOEFL/SAT) share the English template.
function templateFor(className: string): ReportTemplateKind | null {
  switch (className) {
    case LESSON_TYPE_LABELS.MATH:
      return "MATH";
    case LESSON_TYPE_LABELS.IT:
      return "IT";
    case LESSON_TYPE_LABELS.SPEAKING:
      return null;
    default:
      return "ENGLISH";
  }
}

const HW_LABELS: Record<string, string> = {
  COMPLETED: "tam",
  INCOMPLETE: "qismən",
  NOT_DONE: "natamam",
  ASSIGNED: "təyin edilib",
};

const PERF_LABELS: Record<string, string> = {
  EXCELLENT: "əla",
  GOOD: "yaxşı",
  AVERAGE: "orta",
  WEAK: "zəif",
  DID_NOT_PARTICIPATE: "iştirak etmədi",
};

function nameOf(s: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  return (
    [s.firstName, s.lastName].filter(Boolean).join(" ").trim() ||
    s.email.split("@")[0]
  );
}

// POST /api/teacher/schedule/week/reports  { start, end }  (end exclusive)
export async function POST(request: Request) {
  try {
    const user = await requireTeacher();
    const teacherId = (user as any).id as string;

    const limit = RATE_LIMITS.GENERIC_AI_SCORE;
    const rl = checkRateLimit(
      `weekly-report:${teacherId}`,
      limit.maxRequests,
      limit.windowMs
    );
    if (rl.limited) {
      return NextResponse.json(
        {
          error: "Too many report requests",
          hint: `Please wait ${rl.resetIn} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    if (!process.env.OPENAI_API_KEY?.trim()) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured on this server" },
        { status: 503 }
      );
    }

    const { start, end } = bodySchema.parse(await request.json());
    const startUtc = toUtc(start);
    const endUtc = toUtc(end);

    const lessons = await prisma.lessonSession.findMany({
      where: {
        teacherId,
        status: { not: "CANCELLED" },
        classId: { not: null },
        date: { gte: startUtc, lt: endUtc },
      },
      select: {
        id: true,
        topic: true,
        classId: true,
        class: { select: { id: true, name: true } },
        studentRecords: {
          select: {
            studentId: true,
            attendance: true,
            homeworkStatus: true,
            performance: true,
            feedback: true,
            teacherNote: true,
            behaviorNote: true,
            student: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    // Group by class
    type ClassBucket = {
      name: string;
      sessions: typeof lessons;
    };
    const buckets = new Map<string, ClassBucket>();
    for (const l of lessons) {
      if (!l.classId) continue;
      const b = buckets.get(l.classId) ?? { name: l.class?.name ?? "", sessions: [] };
      b.sessions.push(l);
      buckets.set(l.classId, b);
    }

    const jobs: {
      classId: string;
      subject: string;
      kind: ReportTemplateKind;
      students: WeeklyReportStudent[];
    }[] = [];

    for (const [classId, bucket] of buckets) {
      const kind = templateFor(bucket.name);
      if (!kind) continue; // speaking → skip

      const held = bucket.sessions.length;
      const topics = [
        ...new Set(
          bucket.sessions
            .map((s) => (s.topic ?? "").trim())
            .filter((t) => t.length > 0)
        ),
      ];

      // Aggregate per student from records.
      type Agg = {
        name: string;
        attended: number;
        hw: Record<string, number>;
        teacherNotes: string[];
        behaviorNotes: string[];
        performances: string[];
      };
      const perStudent = new Map<string, Agg>();

      for (const session of bucket.sessions) {
        for (const r of session.studentRecords) {
          const agg =
            perStudent.get(r.studentId) ??
            ({
              name: nameOf(r.student),
              attended: 0,
              hw: {},
              teacherNotes: [],
              behaviorNotes: [],
              performances: [],
            } as Agg);

          if (r.attendance === "PRESENT" || r.attendance === "LATE") {
            agg.attended += 1;
          }
          const hwKey = r.homeworkStatus;
          if (hwKey && hwKey !== "NOT_ASSIGNED") {
            agg.hw[hwKey] = (agg.hw[hwKey] ?? 0) + 1;
          }
          const tn = (r.teacherNote ?? r.feedback ?? "").trim();
          if (tn) agg.teacherNotes.push(tn);
          const bn = (r.behaviorNote ?? "").trim();
          if (bn) agg.behaviorNotes.push(bn);
          if (r.performance) agg.performances.push(PERF_LABELS[r.performance] ?? r.performance);

          perStudent.set(r.studentId, agg);
        }
      }

      const students: WeeklyReportStudent[] = [...perStudent.entries()].map(
        ([studentId, a]) => {
          const hwParts = Object.entries(a.hw).map(
            ([k, n]) => `${n} ${HW_LABELS[k] ?? k}`
          );
          const homeworkSummary =
            hwParts.length > 0 ? hwParts.join(", ") : "tapşırıq təyin edilməyib";
          return {
            studentId,
            name: a.name,
            lessonsHeld: held,
            lessonsAttended: a.attended,
            hadAbsence: held - a.attended > 0,
            topics,
            homeworkSummary,
            teacherNotes: a.teacherNotes,
            behaviorNotes: a.behaviorNotes,
            performances: a.performances,
          };
        }
      );

      if (students.length > 0) {
        jobs.push({ classId, subject: bucket.name, kind, students });
      }
    }

    // Generate reports for each class in parallel.
    let results: {
      classId: string;
      subject: string;
      studentId: string;
      studentName: string;
      text: string;
    }[] = [];

    try {
      const generated = await Promise.all(
        jobs.map(async (job) => {
          const reports = await generateWeeklyReports(
            job.kind,
            job.subject,
            job.students
          );
          const nameById = new Map(
            job.students.map((s) => [s.studentId, s.name])
          );
          return reports.map((r) => ({
            classId: job.classId,
            subject: job.subject,
            studentId: r.studentId,
            studentName: nameById.get(r.studentId) ?? "",
            text: r.text,
          }));
        })
      );
      results = generated.flat();
    } catch (aiError: any) {
      handleOpenAIError(aiError);
    }

    results.sort(
      (a, b) =>
        a.subject.localeCompare(b.subject) ||
        a.studentName.localeCompare(b.studentName)
    );

    const candidates = jobs.reduce((n, j) => n + j.students.length, 0);
    const recordsFound = lessons.reduce(
      (n, l) => n + l.studentRecords.length,
      0
    );

    console.log(
      `[weekly-report] ${start}..${end} teacher=${teacherId} lessons=${lessons.length} records=${recordsFound} candidates=${candidates} generated=${results.length}`
    );

    return NextResponse.json({
      reports: results,
      candidates,
      lessonsFound: lessons.length,
      recordsFound,
    });
  } catch (error) {
    return handleApiError(error, "Weekly reports error");
  }
}

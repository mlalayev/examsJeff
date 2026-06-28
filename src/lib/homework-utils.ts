type NameFields = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
};

export function formatUserName(user: NameFields | null | undefined): string | null {
  if (!user) return null;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email || null;
}

const examSelect = {
  id: true,
  title: true,
  category: true,
  track: true,
  durationMin: true,
} as const;

export const assignmentHomeworkSelect = {
  id: true,
  status: true,
  startAt: true,
  dueAt: true,
  createdAt: true,
  isExtra: true,
  student: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  teacher: {
    select: { id: true, firstName: true, lastName: true },
  },
  class: { select: { id: true, name: true } },
  exam: { select: examSelect },
  unitExam: {
    select: {
      id: true,
      exam: { select: examSelect },
      unit: { select: { id: true, title: true, order: true } },
    },
  },
  attempt: { select: { id: true, status: true, bandOverall: true } },
} as const;

export type AssignmentHomeworkRow = {
  id: string;
  status: string;
  startAt: Date | null;
  dueAt: Date | null;
  createdAt: Date;
  isExtra: boolean;
  student: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  teacher: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  class: { id: string; name: string } | null;
  exam: {
    id: string;
    title: string;
    category: string;
    track: string | null;
    durationMin: number | null;
  } | null;
  unitExam: {
    id: string;
    exam: {
      id: string;
      title: string;
      category: string;
      track: string | null;
      durationMin: number | null;
    };
    unit: { id: string; title: string; order: number } | null;
  } | null;
  attempt: { id: string; status: string; bandOverall: number | null } | null;
};

export function mapAssignmentHomeworkRow(a: AssignmentHomeworkRow) {
  const exam = a.exam ?? a.unitExam?.exam ?? null;
  const unit = a.unitExam?.unit ?? null;

  return {
    id: a.id,
    status: a.status,
    startAt: a.startAt,
    dueAt: a.dueAt,
    createdAt: a.createdAt,
    isExtra: a.isExtra,
    student: {
      id: a.student.id,
      name: formatUserName(a.student),
      email: a.student.email,
    },
    teacher: a.teacher
      ? { id: a.teacher.id, name: formatUserName(a.teacher) }
      : null,
    class: a.class,
    exam,
    unit,
    attempt: a.attempt,
  };
}

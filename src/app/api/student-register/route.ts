import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { registerExamRows, registerWeek } from '@/lib/student-register';
import { classExamCategories } from '@/lib/teacher-exam-scope';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const role = (user as any).role;
    if (!['TEACHER', 'ADMIN', 'BOSS', 'CREATOR'].includes(role) || (role === 'TEACHER' && !(user as any).approved)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const query = new URL(request.url).searchParams;
    const month = query.get('month') || '';
    if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)) return NextResponse.json({ error: 'Choose a valid month' }, { status: 400 });
    if (role === 'TEACHER' && query.get('teacherId') && query.get('teacherId') !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const teachers = await prisma.user.findMany({ where: role === 'TEACHER' ? { id: user.id } : { classesTeaching: { some: {} } }, select: { id: true, firstName: true, lastName: true, email: true }, orderBy: { firstName: 'asc' } });
    const teacherId = role === 'TEACHER' ? user.id : query.get('teacherId') || teachers[0]?.id;
    if (teacherId && !teachers.some(t => t.id === teacherId)) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    if (!teacherId) return NextResponse.json({ teachers: [], rows: [], month, canEdit: false });
    const from = new Date(`${month}-01T00:00:00Z`);
    const until = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1));
    const weekFrom = new Date(`${registerWeek(`${month}-01`)}T00:00:00Z`);
    const classes = await prisma.class.findMany({ where: { teacherId }, include: { classStudents: { include: { student: { select: { id: true, firstName: true, lastName: true, email: true } } } } }, orderBy: { name: 'asc' } });
    const [lessons, reports] = await Promise.all([
      prisma.lessonSession.findMany({ where: { teacherId, date: { gte: from, lt: until }, status: { not: 'CANCELLED' } }, include: { studentRecords: { include: { student: { select: { id: true, firstName: true, lastName: true, email: true } } } } }, orderBy: { date: 'asc' } }),
      prisma.weeklyReport.findMany({ where: { teacherId, weekStart: { gte: weekFrom, lt: until } }, select: { id: true, classId: true, studentId: true, weekStart: true, text: true } }),
    ]);
    const studentIds = [...new Set([...classes.flatMap(c => c.classStudents.map(s => s.studentId)), ...lessons.flatMap(l => l.studentRecords.map(r => r.studentId))])];
    const exams = await prisma.exam.findMany({ where: { isHomework: false, category: { in: [...new Set(classes.flatMap(c => classExamCategories(c.name)))] } }, select: { id: true, title: true, category: true } });
    const attempts = await prisma.attempt.findMany({ where: { studentId: { in: studentIds }, examId: { in: exams.map(e => e.id) }, status: { in: ['SUBMITTED', 'DISQUALIFIED'] }, submittedAt: { gte: new Date(from.getTime() - 4 * 3600000), lt: new Date(until.getTime() - 4 * 3600000) } }, select: { id: true, studentId: true, examId: true, submittedAt: true, status: true, sections: { select: { type: true, rubric: true, rawScore: true, maxScore: true } } } });
    const examMap = new Map(exams.map(e => [e.id, e]));
    const rows = classes.flatMap(c => {
      const classLessons = lessons.filter(l => l.classId === c.id);
      const students = new Map(c.classStudents.map(s => [s.student.id, s.student]));
      classLessons.forEach(l => l.studentRecords.forEach(r => students.set(r.studentId, r.student)));
      return [...students.values()].map(student => ({
        id: `${c.id}:${student.id}`, classId: c.id, studentId: student.id, student: [student.firstName, student.lastName].filter(Boolean).join(' ') || student.email, program: c.name,
        lessons: classLessons.filter(l => l.studentRecords.some(r => r.studentId === student.id) || c.classStudents.some(s => s.studentId === student.id)).map(l => { const r = l.studentRecords.find(r => r.studentId === student.id); return { id: l.id, date: l.date.toISOString().slice(0, 10), time: l.timeSlot, attendance: r?.attendance ?? null, lateMinutes: r?.lateMinutes ?? 0, performance: r?.performance ?? null, topic: l.topic }; }),
        exams: c.classStudents.some(s => s.studentId === student.id) ? registerExamRows(c.name, student.id, attempts, examMap) : [],
        reports: reports.filter(r => r.classId === c.id && r.studentId === student.id).map(r => ({ id: r.id, week: r.weekStart.toISOString().slice(0, 10), text: r.text })),
      }));
    });
    return NextResponse.json({ teachers: teachers.map(t => ({ id: t.id, name: [t.firstName, t.lastName].filter(Boolean).join(' ') || t.email })), teacherId, month, canEdit: role === "TEACHER", rows }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (e) { return NextResponse.json({ error: e instanceof Error && e.message === 'Unauthorized' ? 'Unauthorized' : 'Could not load student register' }, { status: e instanceof Error && e.message === 'Unauthorized' ? 401 : 500 }); }
}

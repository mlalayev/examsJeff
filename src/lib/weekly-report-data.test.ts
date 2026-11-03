jest.mock('@/lib/prisma', () => ({ prisma: {
  weeklyReport: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
  lessonSession: { findMany: jest.fn() }, $transaction: jest.fn(),
} }));
jest.mock('@/lib/auth-utils', () => ({ requireTeacher: jest.fn(async () => ({ id: 'teacher' })) }));
jest.mock('@/lib/api-helpers', () => ({ handleApiError: () => new Response('Error', { status: 500 }) }));
jest.mock('@/lib/rate-limiter', () => ({ checkRateLimit: () => ({ limited: false }) }));
jest.mock('@/lib/weekly-report-ai', () => ({ generateWeeklyReports: jest.fn() }));
import { prisma } from './prisma';
import { generateWeeklyReports } from './weekly-report-ai';
import { POST } from '@/app/api/teacher/schedule/week/reports/route';
const db = prisma as any;
const generate = generateWeeklyReports as jest.Mock;
const request = () => new Request('http://localhost/reports', { method: 'POST', body: JSON.stringify({ start: '2026-10-18', end: '2026-10-25', regenerate: true }) });
const record = (attendance: string, homeworkStatus: string) => ({
  studentId: 'student', attendance, homeworkStatus, lateMinutes: 0, performance: 'GOOD',
  teacherNote: '', feedback: 'Needs fraction practice', behaviorNote: '',
  student: { firstName: 'Nuray', lastName: 'Test', email: 'test@example.com' },
});
const oldKey = process.env.OPENAI_API_KEY;
beforeEach(() => {
  jest.clearAllMocks(); process.env.OPENAI_API_KEY = 'test-only';
  db.lessonSession.findMany.mockResolvedValue([
    { id: '1', classId: 'class', class: { name: 'Math' }, topic: 'Fractions', studentRecords: [record('PRESENT', 'COMPLETED')] },
    { id: '2', classId: 'class', class: { name: 'Math' }, topic: 'Powers', studentRecords: [record('ABSENT', 'NOT_DONE')] },
    { id: '3', classId: 'class', class: { name: 'Math' }, topic: 'Unrecorded lesson', studentRecords: [] },
    { id: '4', classId: 'class', class: { name: 'Math' }, topic: 'Revision', studentRecords: [record('EXCUSED', 'ASSIGNED')] },
  ]);
  generate.mockResolvedValue([{ studentId: 'student', text: 'Individual report' }]);
});
afterEach(() => { if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey; });

test('counts recorded attendance and passes only individual topics and homework facts', async () => {
  expect((await POST(request())).status).toBe(200);
  const [student] = generate.mock.calls[0][2];
  expect(student).toMatchObject({ lessonsHeld: 3, lessonsAttended: 1, lessonsExcused: 1, hadAbsence: true });
  expect(student.topics).toEqual(['Fractions', 'Powers', 'Revision']);
  expect(student.homeworkSummary).toContain('yerinə yetirilməyib');
  expect(student.homeworkSummary).toContain('tamamlanması yoxlanmayıb');
  expect(student.teacherNotes).toContain('Needs fraction practice');
});
test('generation failure preserves previously saved reports', async () => {
  generate.mockRejectedValue(new Error('Incomplete report'));
  expect((await POST(request())).status).toBe(500);
  expect(db.weeklyReport.deleteMany).not.toHaveBeenCalled();
  expect(db.weeklyReport.createMany).not.toHaveBeenCalled();
});

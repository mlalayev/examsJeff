jest.mock('@/lib/prisma', () => ({ prisma: {
  dailyReport: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
  weeklyReport: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
  lessonSession: { findMany: jest.fn() }, scheduleSlot: { findMany: jest.fn() }, $transaction: jest.fn(),
} }));
jest.mock('@/lib/auth-utils', () => ({ requireTeacher: jest.fn(async () => ({ id: 'teacher' })) }));
jest.mock('@/lib/api-helpers', () => ({ handleApiError: () => new Response('Error', { status: 500 }) }));
jest.mock('@/lib/rate-limiter', () => ({ checkRateLimit: () => ({ limited: false }) }));
jest.mock('@/lib/weekly-report-ai', () => ({ ...jest.requireActual('./weekly-report-ai'), generateWeeklyReports: jest.fn() }));
import { prisma } from './prisma';
import { generateWeeklyReports, ReportResponseError } from './weekly-report-ai';
import { POST as daily } from '@/app/api/teacher/schedule/day/reports/route';
import { POST as weekly } from '@/app/api/teacher/schedule/week/reports/route';
import { GET as month } from '@/app/api/teacher/schedule/month/route';
const db=prisma as any;
const generate=generateWeeklyReports as jest.Mock;
const request=(body: any={})=>new Request('http://localhost/reports',{method:'POST',body:JSON.stringify({start:'2026-11-15',end:'2026-11-16',teacherId:'someone-else',...body})});
const saved={classId:'class',subject:'Math',studentId:'s',studentName:'Nuray',text:'Saved report'};
const originalKey=process.env.OPENAI_API_KEY;
beforeEach(()=>{
  jest.clearAllMocks(); process.env.OPENAI_API_KEY='test-only';
  db.dailyReport.findMany.mockResolvedValue([]); db.weeklyReport.findMany.mockResolvedValue([]); db.scheduleSlot.findMany.mockResolvedValue([]);
  db.lessonSession.findMany.mockResolvedValue([{id:'lesson',classId:'class',class:{name:'Math'},topic:'Fractions',studentRecords:[{
    studentId:'s',attendance:'LATE',lateMinutes:7,homeworkStatus:'COMPLETED',performance:'GOOD',teacherNote:'Practice fractions',
    student:{firstName:'Nuray',lastName:'Test',email:'n@example.test'},
  }]}]);
  generate.mockResolvedValue([{studentId:'s',text:'Daily report'}]);
});
afterEach(()=>{if(originalKey===undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY=originalKey;});

test('daily report reads one calendar day for the authenticated teacher and saves separately',async()=>{
  expect((await daily(request())).status).toBe(200);
  expect(db.lessonSession.findMany.mock.calls[0][0].where).toEqual({teacherId:'teacher',status:{not:'CANCELLED'},classId:{not:null},date:{gte:new Date('2026-11-15T00:00:00Z'),lt:new Date('2026-11-16T00:00:00Z')}});
  expect(generate.mock.calls[0][2][0]).toMatchObject({lessonsHeld:1,lessonsAttended:1,lateCount:1,lateMinutesTotal:7,topics:['Fractions']});
  expect(generate.mock.calls[0][3]).toEqual({start:'2026-11-15',end:'2026-11-16',kind:'day'});
  expect(db.dailyReport.createMany.mock.calls[0][0].data[0]).toMatchObject({teacherId:'teacher',studentId:'s',day:new Date('2026-11-15T00:00:00Z')});
  expect(db.weeklyReport.findMany).not.toHaveBeenCalled(); expect(db.weeklyReport.deleteMany).not.toHaveBeenCalled();
});

test('daily cache is reused without AI, while Sunday weekly reports still use their own cache',async()=>{
  delete process.env.OPENAI_API_KEY;
  db.dailyReport.findMany.mockResolvedValue([saved]); db.weeklyReport.findMany.mockResolvedValue([{...saved,text:'Weekly saved report'}]);
  expect((await (await daily(request())).json()).reports[0].text).toBe('Saved report');
  expect((await (await weekly(request({end:'2026-11-22'}))).json()).reports[0].text).toBe('Weekly saved report');
  expect(generate).not.toHaveBeenCalled(); expect(db.lessonSession.findMany).not.toHaveBeenCalled();
});

test('failed regeneration preserves the saved daily and weekly reports',async()=>{
  const log=jest.spyOn(console,'error').mockImplementation(()=>{});
  generate.mockRejectedValue(new ReportResponseError('Missing student'));
  try {expect((await daily(request({regenerate:true}))).status).toBe(502);} finally {log.mockRestore();}
  expect(db.dailyReport.deleteMany).not.toHaveBeenCalled(); expect(db.weeklyReport.deleteMany).not.toHaveBeenCalled();
});

test('an empty day has no AI call and no Done record',async()=>{
  delete process.env.OPENAI_API_KEY; db.lessonSession.findMany.mockResolvedValue([]);
  const response=await daily(request()); expect(response.status).toBe(200);
  expect((await response.json()).reports).toEqual([]); expect(generate).not.toHaveBeenCalled(); expect(db.dailyReport.createMany).not.toHaveBeenCalled();
});

test.each([{end:'2026-11-22'},{end:'2026-11-15'},{start:'2026-02-30',end:'2026-03-03'}])('rejects invalid daily ranges before cache or lesson access',async body=>{
  expect((await daily(request(body))).status).toBe(400); expect(db.dailyReport.findMany).not.toHaveBeenCalled(); expect(db.lessonSession.findMany).not.toHaveBeenCalled();
});

test('month response separates daily and weekly completion indicators',async()=>{
  db.dailyReport.findMany.mockResolvedValue([{day:new Date('2026-11-15T00:00:00Z')}]);
  db.weeklyReport.findMany.mockResolvedValue([{weekStart:new Date('2026-11-08T00:00:00Z')}]);
  const response=await month(new Request('http://localhost/month?year=2026&month=11'));
  expect(response.status).toBe(200); expect(await response.json()).toMatchObject({reportDays:['2026-11-15'],reportWeeks:['2026-11-08']});
  expect(db.dailyReport.findMany.mock.calls[0][0].where.teacherId).toBe('teacher');
});

import { GET } from '@/app/api/teacher/schedule/month/summary/route';
import { requireTeacher } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
jest.mock('@/lib/auth-utils',()=>({requireTeacher:jest.fn()}));
jest.mock('@/lib/prisma',()=>({prisma:{lessonSession:{findMany:jest.fn()}}}));
beforeEach(()=>{jest.clearAllMocks();(prisma.lessonSession.findMany as jest.Mock).mockResolvedValue([]);});
test('teacher cannot request another teacher summary',async()=>{
 (requireTeacher as jest.Mock).mockResolvedValue({id:'t',role:'TEACHER'});
 const response=await GET(new Request('http://local?year=2026&month=10&teacherId=other'));
 expect(response.status).toBe(403);expect(prisma.lessonSession.findMany).not.toHaveBeenCalled();
});
test('boss can request the selected teacher without mixing teachers',async()=>{
 (requireTeacher as jest.Mock).mockResolvedValue({id:'boss',role:'BOSS'});
 const response=await GET(new Request('http://local?year=2026&month=10&teacherId=t'));
 expect(response.status).toBe(200);
 expect((prisma.lessonSession.findMany as jest.Mock).mock.calls[0][0].where.teacherId).toBe('t');
});
test('teacher defaults to their own data',async()=>{
 (requireTeacher as jest.Mock).mockResolvedValue({id:'t',role:'TEACHER'});
 await GET(new Request('http://local?year=2026&month=10'));
 expect((prisma.lessonSession.findMany as jest.Mock).mock.calls[0][0].where.teacherId).toBe('t');
});

import { classExamCategories,teacherStudentScope } from './teacher-exam-scope';
import { GET } from '@/app/api/teacher/students/[id]/attempts/route';
import { prisma } from '@/lib/prisma';
jest.mock('@/lib/prisma',()=>({prisma:{class:{findMany:jest.fn()},exam:{findMany:jest.fn()},attempt:{findMany:jest.fn()}}}));
jest.mock('@/lib/auth-utils',()=>({requireTeacher:async()=>({id:'math-teacher',role:'TEACHER'})}));
beforeEach(()=>jest.clearAllMocks());
test('Math and General English do not grant each other exam access',()=>{
 expect(classExamCategories('Math')).toEqual(['MATH']);
 expect(classExamCategories('General English')).toEqual(['GENERAL_ENGLISH']);
 expect(classExamCategories('SAT Math')).toEqual(['SAT']);
 expect(classExamCategories('SAT Verbal')).toEqual(['SAT']);
 expect(classExamCategories('Unknown')).toEqual([]);
});
test('student membership and teacher ownership are required together',async()=>{
 (prisma.class.findMany as jest.Mock).mockResolvedValue([{id:'math',name:'Math'}]);
 const scope=await teacherStudentScope('math-teacher','nuray');
 expect(scope.categories).toEqual(['MATH']);
 expect(prisma.class.findMany).toHaveBeenCalledWith(expect.objectContaining({where:{teacherId:'math-teacher',classStudents:{some:{studentId:'nuray'}}}}));
});
test('API queries only Math exam IDs, preserving all historical attempts',async()=>{
 (prisma.class.findMany as jest.Mock).mockResolvedValue([{id:'math',name:'Math'}]);
 (prisma.exam.findMany as jest.Mock).mockResolvedValue([{id:'math-exam'}]);
 (prisma.attempt.findMany as jest.Mock).mockResolvedValue([]);
 const response=await GET(new Request('http://local'),{params:Promise.resolve({id:'nuray'})});
 expect(response.status).toBe(200);
 expect((prisma.attempt.findMany as jest.Mock).mock.calls[0][0].where.examId).toEqual({in:['math-exam']});
 expect((prisma.attempt.findMany as jest.Mock).mock.calls[0][0].where.status).toBeUndefined();
});
test('unrelated student returns forbidden before reading attempts',async()=>{
 (prisma.class.findMany as jest.Mock).mockResolvedValue([]);
 expect((await GET(new Request('http://local'),{params:Promise.resolve({id:'other'})})).status).toBe(403);
 expect(prisma.attempt.findMany).not.toHaveBeenCalled();
});

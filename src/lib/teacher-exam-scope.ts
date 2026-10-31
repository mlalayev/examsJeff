import { prisma } from '@/lib/prisma';
import type { ExamCategory } from '@prisma/client';
// Unknown class names deliberately grant no exam visibility.
export function classExamCategories(name:string):ExamCategory[] {
 if(name.includes(" + "))return [...new Set(name.split(" + ").flatMap(classExamCategories))];
 const value=name.trim().toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ');
 if(/^sat(?:\s|$)/.test(value))return ['SAT'];
 const mapping:Record<string,ExamCategory[]>={ielts:['IELTS'],toefl:['TOEFL'],math:['MATH'],'riyaziyyat':['MATH'],kids:['KIDS'],'general english':['GENERAL_ENGLISH'],'ingilis dili':['GENERAL_ENGLISH'],placement:['PLACEMENT']};
 return mapping[value] || (/^(a1|a2|b1|b2|c1|c2)\+?$/.test(value)?['GENERAL_ENGLISH']:[]);
}
export async function teacherStudentScope(teacherId:string,studentId:string,classId?:string|null) {
 const classes=await prisma.class.findMany({where:{teacherId,...(classId?{id:classId}:{}),classStudents:{some:{studentId}}},select:{id:true,name:true}});
 return {classes,categories:[...new Set(classes.flatMap(c=>classExamCategories(c.name)))]};
}

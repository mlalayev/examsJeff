import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTeacher } from '@/lib/auth-utils';
import { handleApiError } from '@/lib/api-helpers';
import { classExamCategories } from '@/lib/teacher-exam-scope';
export async function GET() {
 try {
  const user=await requireTeacher();
  const classes=await prisma.class.findMany({where:{teacherId:user.id},select:{name:true,classStudents:{select:{studentId:true}}}});
  const exams=await prisma.exam.findMany({where:{category:{in:[...new Set(classes.flatMap(c=>classExamCategories(c.name)))]}},select:{id:true,title:true,category:true}});
  const attempts=await prisma.attempt.findMany({where:{OR:classes.map(c=>({studentId:{in:c.classStudents.map(s=>s.studentId)},examId:{in:exams.filter(e=>classExamCategories(c.name).includes(e.category)).map(e=>e.id)}}))},include:{sections:true},orderBy:{createdAt:'desc'},take:100});
  const students=await prisma.user.findMany({where:{id:{in:[...new Set(attempts.map(a=>a.studentId))]}},select:{id:true,firstName:true,lastName:true,email:true}});
  return NextResponse.json({attempts:attempts.map(a=>{const student=students.find(s=>s.id===a.studentId);const sections=a.sections.filter(s=>!['WRITING','SPEAKING'].includes(s.type));const correctAnswers=sections.reduce((n,s)=>n+(s.rawScore||0),0);const totalQuestions=sections.reduce((n,s)=>n+(s.maxScore||0),0);return {id:a.id,status:a.status,submittedAt:a.submittedAt,studentName:student?[student.firstName,student.lastName].filter(Boolean).join(' '):'Unknown',studentEmail:student?.email,examTitle:exams.find(e=>e.id===a.examId)?.title,totalScore:totalQuestions?100*correctAnswers/totalQuestions:null,totalQuestions,correctAnswers};})});
 }catch(error){return handleApiError(error,'Teacher attempts');}
}

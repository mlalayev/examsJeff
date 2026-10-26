import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTeacher } from '@/lib/auth-utils';
import { handleApiError } from '@/lib/api-helpers';
import { summarizeAttendance } from '@/lib/student-attendance';
import { z } from 'zod';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
 try {
  const user=await requireTeacher();const {id:studentId}=await params;
  const url=new URL(request.url);const classId=url.searchParams.get('classId');
  const classes=await prisma.class.findMany({where:{teacherId:user.id,...(classId?{id:classId}:{}),classStudents:{some:{studentId}}},select:{id:true}});
  if(!classes.length)return NextResponse.json({error:'Student not in your classes'},{status:403});
  const month=url.searchParams.get('month');
  let range={};
  if(month){const valid=z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).parse(month);const [y,m]=valid.split('-').map(Number);range={gte:new Date(Date.UTC(y,m-1,1)),lt:new Date(Date.UTC(y,m,1))};}
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Baku',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const records=await prisma.lessonStudentRecord.findMany({where:{studentId,teacherId:user.id,classId:{in:classes.map(c=>c.id)},lessonSession:{status:{not:'CANCELLED'},date:{...range,lte:new Date(`${today}T00:00:00Z`)}}},select:{id:true,attendance:true,lateMinutes:true,performance:true,homeworkStatus:true,feedback:true,behaviorNote:true,class:{select:{name:true}},lessonSession:{select:{date:true,timeSlot:true,topic:true}}},orderBy:{lessonSession:{date:'desc'}}});
  return NextResponse.json({records,summary:summarizeAttendance(records)},{headers:{'Cache-Control':'private, no-store'}});
 }catch(error){return handleApiError(error,'Student attendance');}
}

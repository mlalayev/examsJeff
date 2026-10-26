import { NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-helpers';
import { summarizeMonthlyLessons } from '@/lib/monthly-lesson-summary';
import { z } from 'zod';
export async function GET(request:Request) {
 try {
  const user=await requireTeacher();const params=new URL(request.url).searchParams;
  const {year,month}=z.object({year:z.coerce.number().int().min(2000).max(2100),month:z.coerce.number().int().min(1).max(12)}).parse({year:params.get('year'),month:params.get('month')});
  const teacherId=params.get('teacherId')||user.id;
  if(teacherId!==user.id && !['BOSS','CREATOR'].includes(user.role)) return NextResponse.json({error:'Forbidden'},{status:403});
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Baku',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const lessons=await prisma.lessonSession.findMany({where:{teacherId,status:{not:'CANCELLED'},date:{gte:new Date(Date.UTC(year,month-1,1)),lt:new Date(Date.UTC(year,month,1)),lte:new Date(`${today}T00:00:00Z`)}},select:{id:true,title:true,status:true,class:{select:{name:true}},studentRecords:{select:{student:{select:{id:true,firstName:true,lastName:true,email:true}}}}}});
  return NextResponse.json(summarizeMonthlyLessons(lessons),{headers:{'Cache-Control':'private, no-store'}});
 }catch(error){return handleApiError(error,'Monthly lesson summary');}
}

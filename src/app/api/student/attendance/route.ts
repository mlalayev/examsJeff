import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-helpers';
import { summarizeAttendance } from '@/lib/student-attendance';
import { z } from 'zod';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== 'STUDENT') return NextResponse.json({ error: 'Students only' }, { status: 403 });
    const params = new URL(request.url).searchParams;
    const {year, month} = z.object({year:z.coerce.number().int().min(2000).max(2100),month:z.coerce.number().int().min(1).max(12)}).parse({year:params.get('year'),month:params.get('month')});
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku', year:'numeric',month:'2-digit',day:'2-digit' }).format(new Date());
    const records = await prisma.lessonStudentRecord.findMany({
      where: { studentId: user.id, lessonSession: { status: { not: 'CANCELLED' }, date: { gte: new Date(Date.UTC(year,month-1,1)), lt: new Date(Date.UTC(year,month,1)), lte: new Date(`${today}T00:00:00Z`) } } },
      select: { id:true, attendance:true, lateMinutes:true, performance:true, homeworkStatus:true, feedback:true, behaviorNote:true,
        lessonSession: { select: { date:true, title:true, topic:true, timeSlot:true } },
        class: { select: { name:true } }, teacher: { select: { firstName:true,lastName:true } },
      }, orderBy: { lessonSession: { date:'desc' } },
    });
    return NextResponse.json({ records, summary: summarizeAttendance(records) }, { headers: { 'Cache-Control':'private, no-store' } });
  } catch (error) { return handleApiError(error, 'Student attendance error'); }
}

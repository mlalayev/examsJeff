import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTeacher, getScopedBranchId } from '@/lib/auth-utils';
import { handleApiError } from '@/lib/api-helpers';
import { z } from 'zod';
const schema = z.object({ students: z.array(z.object({ id: z.string().min(1), firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().max(100) })).max(200) }).refine(d => new Set(d.students.map(s=>s.id)).size === d.students.length);
type Context = { params: Promise<{slotId:string}> };
export async function GET(_request: Request, {params}: Context) {
  try {
    const user = await requireTeacher(); const {slotId} = await params;
    const slot = await prisma.scheduleSlot.findFirst({where:{id:slotId,teacherId:user.id},include:{class:{include:{classStudents:{include:{student:{select:{id:true,firstName:true,lastName:true,email:true}}}}}}}});
    if (!slot?.class) return NextResponse.json({error:'Class not found'}, {status:404});
    return NextResponse.json({students:slot.class.classStudents.map(r=>r.student)});
  } catch(error) { return handleApiError(error, 'Load roster'); }
}
export async function PUT(request: Request, {params}: Context) {
  try {
    const user = await requireTeacher(); const {slotId} = await params;
    const {students} = schema.parse(await request.json()); const branchId = getScopedBranchId(user);
    return await prisma.$transaction(async tx => {
      const slot = await tx.scheduleSlot.findFirst({where:{id:slotId,teacherId:user.id},include:{class:{include:{classStudents:true}}}});
      if (!slot?.class || slot.class.teacherId !== user.id) return NextResponse.json({error:'Class not found'}, {status:404});
      const found = await tx.user.findMany({where:{id:{in:students.map(s=>s.id)},role:'STUDENT',...(branchId?{branchId}:{})},select:{id:true,firstName:true,lastName:true}});
      if(found.length !== students.length) return NextResponse.json({error:'One or more students are unavailable'}, {status:400});
      const existing = new Set(slot.class.classStudents.map(r=>r.studentId));
      for(const student of students) {
        const account = found.find(s=>s.id===student.id)!;
        const changed = student.firstName !== (account.firstName || '') || student.lastName !== (account.lastName || '');
        if(changed && !existing.has(student.id)) return NextResponse.json({error:'Add the student to this class before editing their account name.'},{status:400});
      }
      for(const student of students) {
        if(existing.has(student.id)) await tx.user.update({where:{id:student.id},data:{firstName:student.firstName,lastName:student.lastName}});
      }
      await tx.classStudent.deleteMany({where:{classId:slot.classId!,studentId:{notIn:students.map(s=>s.id)}}});
      await tx.classStudent.createMany({data:students.map(s=>({classId:slot.classId!,studentId:s.id})),skipDuplicates:true});
      return NextResponse.json({success:true});
    });
  } catch(error) { return handleApiError(error, 'Save roster'); }
}

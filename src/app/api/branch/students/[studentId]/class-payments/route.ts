import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireBranchAdmin, getScopedBranchId } from '@/lib/auth-utils';
import { handleApiError } from '@/lib/api-helpers';
import { classPaymentRows, dueDateFor } from '@/lib/class-payments';
import { z } from 'zod';
const period = z.object({ year: z.coerce.number().int().min(2020).max(2100), month: z.coerce.number().int().min(1).max(12) });
async function access(studentId: string) { const user = await requireBranchAdmin(); const branchId = getScopedBranchId(user); if (!["BOSS", "ADMIN", "CREATOR"].includes((user as any).role) && !branchId)
    throw new Error("Forbidden: No branch assigned"); const student = await prisma.user.findFirst({ where: { id: studentId, role: 'STUDENT', ...(branchId ? { branchId } : {}) }, select: { id: true } }); if (!student)
    throw new Error('Forbidden'); return { branchId }; }
export async function GET(request: Request, { params }: {
    params: Promise<{
        studentId: string;
    }>;
}) { try {
    const { studentId } = await params;
    await access(studentId);
    const url = new URL(request.url);
    const { year, month } = period.parse(Object.fromEntries(url.searchParams));
    return NextResponse.json({ rows: await classPaymentRows(year, month, { studentId }) });
}
catch (e) {
    return handleApiError(e, 'Class payments');
} }
export async function PUT(request: Request, { params }: {
    params: Promise<{
        studentId: string;
    }>;
}) {
    try {
        const { studentId } = await params;
        const { branchId } = await access(studentId);
        const data = period.extend({ classId: z.string().min(1), expected: z.number().min(0).max(99999999.99).multipleOf(0.01), paid: z.number().min(0).max(99999999.99).multipleOf(0.01), dueDay: z.number().int().min(1).max(31), setDefault: z.boolean().default(false) }).refine(d => d.paid <= d.expected, { message: 'Paid cannot exceed expected amount' }).parse(await request.json());
        const cls = await prisma.class.findFirst({ where: { id: data.classId, ...(branchId ? { branchId } : {}) }, select: { teacherId: true } });
        if (!cls)
            return NextResponse.json({ error: 'Class not found' }, { status: 404 });
        await prisma.$transaction(async (tx) => {
            const member = await tx.classStudent.findUnique({ where: { classId_studentId: { classId: data.classId, studentId } } });
            const key = { classId: data.classId, studentId, year: data.year, month: data.month };
            const existing = await tx.classMonthlyPayment.findUnique({ where: { classId_studentId_year_month: key } });
            if (!member && !existing)
                throw new Error('Forbidden: Student is not in this class');
            if (data.setDefault && member)
                await tx.classStudent.update({ where: { id: member.id }, data: { monthlyFee: data.expected, paymentDueDay: data.dueDay } });
            const values = { expected: data.expected, paid: data.paid, dueDate: dueDateFor(data.year, data.month, data.dueDay), paidAt: data.paid > 0 ? (existing && Number(existing.paid) === data.paid ? existing.paidAt : new Date()) : null };
            await tx.classMonthlyPayment.upsert({ where: { classId_studentId_year_month: key }, create: { ...key, teacherId: cls.teacherId, ...values }, update: values });
        });
        return NextResponse.json({ success: true });
    }
    catch (e) {
        return handleApiError(e, 'Save class payment');
    }
}

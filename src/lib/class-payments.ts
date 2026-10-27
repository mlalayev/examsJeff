import { prisma } from '@/lib/prisma';
export function paymentState(expected: number | null, paid: number, dueDate: string, today: string) {
    if (expected === null)
        return 'NOT_SET';
    if (paid >= expected)
        return 'PAID';
    if (paid > 0)
        return 'PARTIAL';
    return dueDate < today ? 'OVERDUE' : 'PENDING';
}
export function dueDateFor(year: number, month: number, day: number) {
    return new Date(Date.UTC(year, month - 1, Math.min(day, new Date(Date.UTC(year, month, 0)).getUTCDate())));
}
export async function classPaymentRows(year: number, month: number, filter: {
    teacherId?: string;
    studentId?: string;
}) {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const [members, payments] = await Promise.all([
        prisma.classStudent.findMany({ where: { ...(filter.studentId ? { studentId: filter.studentId } : {}), ...(filter.teacherId ? { class: { teacherId: filter.teacherId } } : {}) }, include: { class: { select: { id: true, name: true, teacherId: true, teacher: { select: { firstName: true, lastName: true } } } }, student: { select: { id: true, firstName: true, lastName: true, email: true } } } }),
        prisma.classMonthlyPayment.findMany({ where: { year, month, ...(filter.studentId ? { studentId: filter.studentId } : {}), ...(filter.teacherId ? { OR: [{ teacherId: filter.teacherId }, { classId: { in: (await prisma.class.findMany({ where: { teacherId: filter.teacherId }, select: { id: true } })).map(c => c.id) } }] } : {}) } })
    ]);
    const rows = members.filter(m => m.createdAt < new Date(Date.UTC(year, month, 1)) && (!filter.teacherId || !payments.some(p => p.classId === m.classId && p.studentId === m.studentId && p.teacherId !== filter.teacherId))).map(m => {
        const payment = payments.find(p => p.classId === m.classId && p.studentId === m.studentId);
        const expected = payment ? Number(payment.expected) : m.monthlyFee === null || `${year}-${String(month).padStart(2, '0')}` < today.slice(0, 7) ? null : Number(m.monthlyFee);
        const paid = payment ? Number(payment.paid) : 0;
        const dueDate = (payment?.dueDate || dueDateFor(year, month, m.paymentDueDay)).toISOString().slice(0, 10);
        return { classId: m.classId, className: m.class.name, studentId: m.studentId, name: [m.student.firstName, m.student.lastName].filter(Boolean).join(' ') || m.student.email, teacherName: [m.class.teacher.firstName, m.class.teacher.lastName].filter(Boolean).join(' '), expected, paid, dueDate, paidAt: payment?.paidAt?.toISOString() || null, status: paymentState(expected, paid, dueDate, today), defaultFee: m.monthlyFee === null ? null : Number(m.monthlyFee), dueDay: payment ? payment.dueDate.getUTCDate() : m.paymentDueDay };
    });
    // Keep actual historical charges after a roster member is removed.
    for (const payment of payments) {
        if (filter.teacherId && payment.teacherId !== filter.teacherId)
            continue;
        if (rows.some(r => r.classId === payment.classId && r.studentId === payment.studentId))
            continue;
        const [student, cls] = await Promise.all([prisma.user.findUnique({ where: { id: payment.studentId }, select: { firstName: true, lastName: true, email: true } }), prisma.class.findUnique({ where: { id: payment.classId }, select: { name: true } })]);
        const expected = Number(payment.expected), paid = Number(payment.paid), dueDate = payment.dueDate.toISOString().slice(0, 10);
        rows.push({ classId: payment.classId, className: cls?.name || 'Archived class', studentId: payment.studentId, name: student ? [student.firstName, student.lastName].filter(Boolean).join(' ') || student.email : 'Archived student', teacherName: '', expected, paid, dueDate, paidAt: payment.paidAt?.toISOString() || null, status: paymentState(expected, paid, dueDate, today), defaultFee: null, dueDay: payment.dueDate.getUTCDate() });
    }
    return rows;
}

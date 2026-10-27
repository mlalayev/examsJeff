import { NextResponse } from 'next/server';
import { requireBoss } from '@/lib/auth-utils';
import { classPaymentRows } from '@/lib/class-payments';
import { handleApiError } from '@/lib/api-helpers';
import { z } from 'zod';
export async function GET(request: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}) { try {
    await requireBoss();
    const { id } = await params;
    const { year, month } = z.object({ year: z.coerce.number().int().min(2020).max(2100), month: z.coerce.number().int().min(1).max(12) }).parse(Object.fromEntries(new URL(request.url).searchParams));
    const rows = await classPaymentRows(year, month, { teacherId: id });
    return NextResponse.json({ rows, expected: rows.reduce((n, r) => n + Math.round((r.expected || 0) * 100), 0) / 100, paid: rows.reduce((n, r) => n + Math.round(r.paid * 100), 0) / 100, unconfigured: rows.filter(r => r.expected === null).length });
}
catch (e) {
    return handleApiError(e, 'Teacher revenue');
} }

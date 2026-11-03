import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function integrityBlock(attemptId: string) {
  const policy = await prisma.examIntegrity.findUnique({ where: { attemptId } });
  if (!policy) return null; // Legacy and SAT/Math are unchanged.
  if (policy.state === 'INVALID') return NextResponse.json({ error: 'İmtahan nəzarəti qaydası pozulub. Nəticə etibarsızdır.', code: 'EXAM_INVALIDATED' }, { status: 409 });
  if (policy.state === 'PENDING') return NextResponse.json({ error: 'Cihaz yoxlamasını və qaydaların qəbulunu tamamlayın.', code: 'EXAM_PREFLIGHT_REQUIRED' }, { status: 409 });
  return null;
}

export function canReviewIntegrity(user: { id: string; role?: string; branchId?: string | null }, attempt: { studentId: string; branchId: string | null }) {
  if (['CREATOR', 'ADMIN', 'BOSS'].includes(user.role || '')) return true;
  return ['TEACHER', 'BRANCH_ADMIN', 'BRANCH_BOSS'].includes(user.role || '') && !!user.branchId && user.branchId === attempt.branchId;
}

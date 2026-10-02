import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { canReviewIntegrity } from '@/lib/exam-integrity';
import { z } from 'zod';

type Context = { params: Promise<{ attemptId: string }> };
const eventSchema = z.object({
  id: z.string().min(1).max(100),
  kind: z.enum(['FULLSCREEN_EXIT', 'PAGE_HIDDEN', 'PAGE_LEAVE', 'RESUMED', 'OFFLINE', 'PASTE', 'WRITING_SNAPSHOT']),
  length: z.number().int().min(0).max(100000).optional(),
  field: z.string().max(120).optional(),
});
const input = z.discriminatedUnion('action', [
  z.object({ action: z.literal('start'), accepted: z.literal(true), policyVersion: z.literal(1) }),
  z.object({ action: z.literal('event'), event: eventSchema }),
  z.object({ action: z.literal('review'), note: z.string().trim().min(10).max(2000) }),
]);

export async function GET(_request: Request, { params }: Context) {
  try {
    const user = await requireAuth();
    const { attemptId } = await params;
    const attempt = await prisma.attempt.findUnique({ where: { id: attemptId }, include: { integrity: true } });
    if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const staff = canReviewIntegrity(user, attempt);
    const parent = user.role === 'PARENT' && !!(await prisma.parentChild.findFirst({ where: { parentId: user.id, childId: attempt.studentId }, select: { id: true } }));
    if (attempt.studentId !== user.id && !staff && !parent) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const exam = await prisma.exam.findUnique({ where: { id: attempt.examId }, select: { sections: { select: { type: true } } } });
    const events = staff && attempt.integrity ? await prisma.examIntegrityEvent.findMany({ where: { attemptId }, orderBy: { occurredAt: 'desc' }, take: 200 }) : [];
    const evidence = staff && attempt.integrity?.state === 'INVALID' ? {
      answers: attempt.answers,
      normalized: await prisma.attemptAnswer.findMany({ where: { attemptId }, select: { questionId: true, section: true, answer: true } }),
      sections: await prisma.attemptSection.findMany({ where: { attemptId }, select: { type: true, answers: true } }),
    } : undefined;
    const policy = !attempt.integrity || staff ? attempt.integrity : { state: attempt.integrity.state, policyVersion: attempt.integrity.policyVersion, acceptedAt: attempt.integrity.acceptedAt, invalidatedAt: attempt.integrity.invalidatedAt };
    return NextResponse.json({ policy, status: attempt.status, hasSpeaking: exam?.sections.some(s => s.type === 'SPEAKING'), canReview: staff, events, evidence });
  } catch (error) { return NextResponse.json({ error: 'Cannot load exam security state' }, { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 503 }); }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const user = await requireAuth();
    const { attemptId } = await params;
    const body = input.parse(await request.json());
    return await prisma.$transaction(async tx => {
      // Same row lock as submit: whichever commits first defines the terminal outcome.
      await tx.$queryRaw`SELECT id FROM attempts WHERE id = ${attemptId} FOR UPDATE`;
      const attempt = await tx.attempt.findUnique({ where: { id: attemptId }, include: { integrity: true } });
      if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      if (body.action === 'review') {
        if (!canReviewIntegrity(user, attempt)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        if (!attempt.integrity) return NextResponse.json({ error: 'No policy' }, { status: 400 });
        await tx.examIntegrity.update({ where: { attemptId }, data: { reviewNote: body.note, reviewedById: user.id, reviewedAt: new Date() } });
        // Review is an audit note, not a silent override or deletion of evidence.
        return NextResponse.json({ success: true });
      }
      if (attempt.studentId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      const policy = attempt.integrity;
      if (!policy) return NextResponse.json({ success: true, exempt: true });
      if (body.action === 'start') {
        if (policy.state === 'INVALID' || attempt.status !== 'IN_PROGRESS') return NextResponse.json({ error: 'Attempt is closed' }, { status: 409 });
        if (policy.state === 'PENDING') {
          const now = new Date();
          await tx.examIntegrity.update({ where: { attemptId }, data: { state: 'ACTIVE', acceptedAt: now } });
          await tx.attempt.update({ where: { id: attemptId }, data: { startedAt: now } });
        }
        return NextResponse.json({ success: true });
      }
      // Late browser events after successful submission must not disqualify a student.
      if (policy.state !== 'ACTIVE' || attempt.status !== 'IN_PROGRESS') return NextResponse.json({ success: true, ignored: true });
      const { event } = body;
      const exists = await tx.examIntegrityEvent.findUnique({ where: { id: event.id } });
      if (exists) return NextResponse.json({ success: exists.attemptId === attemptId }, { status: exists.attemptId === attemptId ? 200 : 400 });
      const count = await tx.examIntegrityEvent.count({ where: { attemptId } });
      if (count >= 2000 && event.kind !== 'FULLSCREEN_EXIT') return NextResponse.json({ success: true, capped: true });
      await tx.examIntegrityEvent.create({ data: { id: event.id, attemptId, kind: event.kind, metadata: { length: event.length, field: event.field } } });
      if (event.kind === 'FULLSCREEN_EXIT') {
        await tx.examIntegrity.update({ where: { attemptId }, data: { state: 'INVALID', invalidatedAt: new Date() } });
        await tx.attempt.update({ where: { id: attemptId }, data: { status: 'DISQUALIFIED', bandOverall: null, placementLevel: null, placementBreakdown: undefined } });
      }
      return NextResponse.json({ success: true, invalidated: event.kind === 'FULLSCREEN_EXIT' });
    });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid security event' }, { status: 400 });
    return NextResponse.json({ error: 'Security update failed; please retry' }, { status: 503 });
  }
}

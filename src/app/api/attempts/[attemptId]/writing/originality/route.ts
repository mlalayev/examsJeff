import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { canReviewIntegrity, integrityBlock } from '@/lib/exam-integrity';
import { reviewWritingOriginality, writingSourceHash } from '@/lib/writing-originality';
import { checkRateLimit } from '@/lib/rate-limiter';
type Context = { params: Promise<{ attemptId: string }> };

async function source(attemptId: string) {
  const [attempt, rows, submission] = await Promise.all([
    prisma.attempt.findUnique({ where: { id: attemptId }, include: { sections: { where: { type: 'WRITING' } } } }),
    prisma.attemptAnswer.findMany({ where: { attemptId, section: 'WRITING' } }),
    prisma.writingSubmission.findFirst({ where: { attemptId } }),
  ]);
  const raw = (attempt?.answers as any)?.WRITING || {};
  const merged = Object.assign({}, raw, ...((attempt?.sections || []).map(s => s.answers || {})), Object.fromEntries(rows.map(r => [r.questionId, r.answer])));
  const texts = Object.keys(merged).sort().map(key => merged[key]).filter((v): v is string => typeof v === 'string' && !!v.trim());
  if (!texts.length && submission) texts.push(submission.task1Response, submission.task2Response);
  return { attempt, texts: texts.filter(Boolean) };
}

export async function GET(_request: Request, { params }: Context) {
  try {
    const user = await requireAuth(); const { attemptId } = await params;
    const { attempt, texts } = await source(attemptId);
    if (!attempt || !canReviewIntegrity(user, attempt)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const review = await prisma.writingOriginalityReview.findUnique({ where: { attemptId } });
    const stale = review?.sourceHash !== writingSourceHash(texts);
    const expired = review?.state === 'CHECKING' && Date.now() - review.updatedAt.getTime() > 120000;
    return NextResponse.json({ review: stale ? null : expired ? { ...review, state: 'FAILED' } : review, hasWriting: texts.length > 0 });
  } catch { return NextResponse.json({ error: 'Cannot load writing review' }, { status: 500 }); }
}
export async function POST(_request: Request, { params }: Context) {
  let claimed: { attemptId: string; hash: string; time: Date } | null = null;
  try {
    const user = await requireAuth(); const { attemptId } = await params;
    const { attempt, texts } = await source(attemptId);
    if (!attempt || !canReviewIntegrity(user, attempt)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const blocked = await integrityBlock(attemptId); if (blocked) return blocked;
    if (attempt.status !== 'SUBMITTED') return NextResponse.json({ error: 'Submit the exam first' }, { status: 409 });
    if (!texts.length) return NextResponse.json({ error: 'No saved writing answers' }, { status: 400 });
    if (texts.join('').length > 60000) return NextResponse.json({ error: 'Writing is too long for this review' }, { status: 400 });
    if (checkRateLimit(`writing-originality:${user.id}`, 5, 60000).limited) return NextResponse.json({ error: 'Please retry later' }, { status: 429 });
    const hash = writingSourceHash(texts); const now = new Date();
    const acquired = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM attempts WHERE id = ${attemptId} FOR UPDATE`;
      const previous = await tx.writingOriginalityReview.findUnique({ where: { attemptId } });
      if (previous?.sourceHash === hash && ['REVIEW_REQUIRED', 'INSUFFICIENT_EVIDENCE'].includes(previous.state)) return { cached: previous };
      if (previous?.state === 'CHECKING' && now.getTime() - previous.updatedAt.getTime() < 120000) return { busy: true };
      await tx.writingOriginalityReview.upsert({ where: { attemptId }, create: { attemptId, state: 'CHECKING', sourceHash: hash, requestedBy: user.id, updatedAt: now }, update: { state: 'CHECKING', sourceHash: hash, requestedBy: user.id, updatedAt: now } });
      return { claimed: true };
    });
    if (acquired.cached) return NextResponse.json({ review: acquired.cached });
    if (acquired.busy) return NextResponse.json({ error: 'Review already running' }, { status: 409 });
    claimed = { attemptId, hash, time: now };
    const events = await prisma.examIntegrityEvent.findMany({ where: { attemptId, kind: { in: ['PASTE', 'WRITING_SNAPSHOT'] } }, take: 2000 });
    const paste = events.filter(e => e.kind === 'PASTE');
    const signals = { pasteCount: paste.length, pastedCharacters: paste.reduce((n, e) => n + (Number((e.metadata as any)?.length) || 0), 0), snapshots: events.filter(e => e.kind === 'WRITING_SNAPSHOT').length };
    const result = await reviewWritingOriginality(texts, signals);
    const latest = await source(attemptId);
    if (writingSourceHash(latest.texts) !== hash || latest.attempt?.status !== 'SUBMITTED') throw new Error('Source changed');
    const updated = await prisma.writingOriginalityReview.updateMany({ where: { attemptId, sourceHash: hash, state: 'CHECKING', updatedAt: now }, data: { state: result.outcome, result: { ...result, signals, method: 'AI_ASSISTED_REVIEW_NOT_AUTHORSHIP_DETECTION' } } });
    if (!updated.count) return NextResponse.json({ error: 'Review superseded; reload' }, { status: 409 });
    return NextResponse.json({ review: await prisma.writingOriginalityReview.findUnique({ where: { attemptId } }) });
  } catch {
    if (claimed) await prisma.writingOriginalityReview.updateMany({ where: { attemptId: claimed.attemptId, sourceHash: claimed.hash, state: 'CHECKING', updatedAt: claimed.time }, data: { state: 'FAILED' } }).catch(() => {});
    return NextResponse.json({ error: 'Yoxlama alınmadı. Cavablar və qiymətlər dəyişdirilmədi. Yenidən cəhd edin.' }, { status: 503 });
  }
}

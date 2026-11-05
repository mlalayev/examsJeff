import { prisma } from './prisma';
import { scoreGeneralWriting, writingText, writingSourceHash, type GeneralWritingAssessment } from './general-writing-ai';
import { scoreQuestion, scoreImageInteractiveQuestion } from './scoring';
import { tryAwardExamScoreReward } from './coins';
import { combineGeneralWriting } from './general-writing-total';

export async function gradeGeneralWritingAttempt(attemptId: string, force = false) {
  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId }, include: { sections: true, integrity: true } });
  if (!attempt || attempt.status !== 'SUBMITTED' || attempt.integrity?.state === 'INVALID') throw new Error('Attempt is not available for grading');
  const exam = await prisma.exam.findUnique({ where: { id: attempt.examId }, include: { sections: { include: { questions: true } } } });
  if (!exam || exam.category !== 'GENERAL_ENGLISH') throw new Error('Not a General English exam');
  const target = attempt.sections.find(s => s.type === 'WRITING' && (s.rubric as any)?.generalWritingStatus) ?? attempt.sections.find(s => s.type === 'WRITING');
  if (!target) throw new Error('Writing section not found');
  const questions = exam.sections.flatMap(section => section.type === 'WRITING'
    ? section.questions.filter(q => q.qtype === 'ESSAY').map(q => ({ q, section })) : []);
  if (!questions.length) throw new Error('No writing essays found');
  const normalized = await prisma.attemptAnswer.findMany({ where: { attemptId, section: 'WRITING' } });
  const normalizedById = new Map(normalized.map(a => [a.questionId, a.answer]));
  const stored = (target.rubric as any)?.generalWriting as GeneralWritingAssessment[] | undefined;
  const assessments: GeneralWritingAssessment[] = [];
  let cached = true;
  for (const { q, section } of questions) {
    const legacy = attempt.answers as any;
    const sectionAnswer = attempt.sections.map(s => (s.answers as any)?.[q.id]).find(a => a !== undefined);
    const answer = writingText(normalizedById.has(q.id) ? normalizedById.get(q.id)
      : legacy?.[section.id]?.[q.id] ?? sectionAnswer ?? legacy?.WRITING?.[q.id]);
    const hash = writingSourceHash(q.prompt, answer, exam.track);
    const previous = Array.isArray(stored) ? stored.find(a => a.questionId === q.id && a.sourceHash === hash) : undefined;
    if (previous && !force) { assessments.push(previous); continue; }
    cached = false;
    const result = await scoreGeneralWriting(q.prompt, answer, exam.track);
    assessments.push({ questionId: q.id, sectionId: section.id, title: section.title, ...result, sourceHash: hash });
  }
  const objectiveQuestions = exam.sections.flatMap((section: any) => section.questions.filter((q: any) => q.qtype !== 'ESSAY').map((q: any) => ({ q, section })));
  let earned = 0, maximum = 0;
  const allAnswers = await prisma.attemptAnswer.findMany({ where: { attemptId } });
  const answerMap = new Map(allAnswers.map(a => [a.questionId, a.answer]));
  for (const { q, section } of objectiveQuestions) {
    const value = answerMap.has(q.id) ? answerMap.get(q.id) : (attempt.answers as any)?.[section.id]?.[q.id] ?? attempt.sections.map((s: any) => s.answers?.[q.id]).find((a: any) => a !== undefined) ?? (attempt.answers as any)?.[section.type]?.[q.id];
    const max = q.maxScore ?? 1;
    maximum += max;
    earned += (q.qtype === 'IMAGE_INTERACTIVE' ? scoreImageInteractiveQuestion(value, q.answerKey, q.options) : scoreQuestion(q.qtype, value, q.answerKey)) * max;
  }
  const overall = combineGeneralWriting(earned, maximum, assessments.map(a => a.score));
  {
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM attempts WHERE id = ${attemptId} FOR UPDATE`;
      const latest = await tx.attempt.findUnique({ where: { id: attemptId }, include: { integrity: true } });
      if (latest?.status !== 'SUBMITTED' || latest.integrity?.state === 'INVALID') throw new Error('Attempt is no longer available for grading');
      const section = await tx.attemptSection.findUnique({ where: { id: target.id } });
      await tx.attemptSection.update({ where: { id: target.id }, data: { rubric: { ...((section?.rubric as any) || {}), generalWriting: assessments, generalWritingStatus: 'COMPLETED', generalOverall: overall, generalWritingPercent: assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length, generalObjectivePercent: maximum > 0 ? 100 * earned / maximum : null } } });
      await tx.attempt.update({ where: { id: attemptId }, data: { bandOverall: overall } });
      await tryAwardExamScoreReward(attemptId, tx);
    });
  }
  return { success: true, cached, generalWriting: assessments, generalWritingStatus: 'COMPLETED', generalOverall: overall, generalWritingPercent: assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length, generalObjectivePercent: maximum > 0 ? 100 * earned / maximum : null };
}

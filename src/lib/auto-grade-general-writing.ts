import { gradeGeneralWritingAttempt } from './grade-general-writing';

/** Submission is already durable. A provider failure must never undo it. */
export async function autoGradeGeneralWriting(attemptId: string) {
  for (let retry = 0; retry < 2; retry++) {
    try {
      const result = await gradeGeneralWritingAttempt(attemptId);
      return { writingGradingStatus: 'COMPLETED', overallPercent: result.generalOverall };
    } catch (error) {
      console.error('Automatic writing grading failed', { attemptId, retry, message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
  return { writingGradingStatus: 'PENDING', overallPercent: null };
}

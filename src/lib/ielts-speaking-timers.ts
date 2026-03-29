/** Per-question timing for IELTS Speaking (run page + recording UI). */

export type SpeakingPartKey = 1 | 2 | 3;

export interface IeltsSpeakingPhaseTiming {
  /** Thinking (P1) or preparation (P2/P3), seconds */
  prep: number;
  /** Recording / speaking time, seconds */
  speak: number;
}

export const IELTS_SPEAKING_TIMING: Record<SpeakingPartKey, IeltsSpeakingPhaseTiming> = {
  1: { prep: 10, speak: 50 },
  2: { prep: 60, speak: 120 },
  3: { prep: 15, speak: 80 },
};

export function getSpeakingTiming(part: number): IeltsSpeakingPhaseTiming {
  const p = (part >= 1 && part <= 3 ? part : 1) as SpeakingPartKey;
  return IELTS_SPEAKING_TIMING[p];
}

export function totalSecondsForSpeakingPart(part: number): number {
  const { prep, speak } = getSpeakingTiming(part);
  return prep + speak;
}

export function prepSecondsForSpeakingPart(part: number): number {
  return getSpeakingTiming(part).prep;
}

export function speakSecondsForSpeakingPart(part: number): number {
  return getSpeakingTiming(part).speak;
}

/** Countdown value is time left in the whole question window. */
export function isSpeakingPrepPhase(part: number, secondsLeft: number): boolean {
  return secondsLeft > speakSecondsForSpeakingPart(part);
}

export function recordingMarkerPercent(part: number): number {
  const { prep, speak } = getSpeakingTiming(part);
  return (prep / (prep + speak)) * 100;
}

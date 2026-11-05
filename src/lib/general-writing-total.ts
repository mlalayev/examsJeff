/** Writing has 20% weight; objective questions together have 80%. */
export function combineGeneralWriting(earned: number, maximum: number, scores: number[]): number | null {
  if (!scores.length) return maximum > 0 ? Math.round(100 * earned / maximum) : null;
  const writing = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round(maximum > 0 ? 0.8 * (100 * earned / maximum) + 0.2 * writing : writing);
}

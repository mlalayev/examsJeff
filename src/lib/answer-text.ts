/** Normalize typography and spacing without erasing numeric signs or fractions. */
export function normalizeAnswerText(value: unknown): string {
  if (typeof value !== 'string' && (typeof value !== 'number' || !Number.isFinite(value))) return '';
  return String(value).normalize('NFKC').toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2212/g, '-')
    .replace(/[\u200b\ufeff]/g, '')
    .replace(/\s+/g, ' ').trim();
}

export function textAnswersMatch(student: unknown, expected: unknown): boolean {
  const actual = normalizeAnswerText(student);
  const correct = normalizeAnswerText(expected);
  if (!actual || !correct) return false;
  // A sentence-ending mark is harmless for words, but decimals and signs matter.
  const prose = (s: string) => /[\p{L}]/u.test(s) ? s.replace(/[.!?]+$/, '').trim() : s;
  return prose(actual) === prose(correct);
}

export function withSatBreak<T extends { id: string; title: string; order: number; durationMin: number; questions: unknown[] }>(sections: T[], homework = false): T[] {
  const sorted = [...sections].sort((a, b) => a.order - b.order);
  if (homework || sorted.some(s => /break/i.test(s.title)) || sorted.length !== 4) return sorted;
  if (!/math/i.test(sorted[2].title) || /math/i.test(sorted[1].title)) return sorted;
  return [...sorted.slice(0, 2), { ...sorted[1], id: 'sat-verbal-math-break', title: '10-minute break', durationMin: 10, questions: [], order: 1.5 }, ...sorted.slice(2)];
}

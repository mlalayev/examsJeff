export function recurringDayType(date: Date): 'ODD' | 'EVEN' | null {
  const weekday = date.getUTCDay();
  return weekday === 0 ? null : weekday % 2 === 1 ? 'ODD' : 'EVEN';
}

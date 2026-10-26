import { recurringDayType } from './schedule-days';
test('weekday assignments stay stable across month boundaries', () => {
  expect(recurringDayType(new Date('2026-10-26T00:00:00Z'))).toBe('ODD');
  expect(recurringDayType(new Date('2026-10-27T00:00:00Z'))).toBe('EVEN');
  expect(recurringDayType(new Date('2026-11-02T00:00:00Z'))).toBe('ODD');
  expect(recurringDayType(new Date('2026-11-03T00:00:00Z'))).toBe('EVEN');
  expect(recurringDayType(new Date('2026-11-01T00:00:00Z'))).toBeNull();
});
test('all weekdays follow the same recurring pattern', () => {
  expect(Array.from({length:7},(_,i)=>recurringDayType(new Date(Date.UTC(2026,9,25+i))))).toEqual([null,'ODD','EVEN','ODD','EVEN','ODD','EVEN']);
});

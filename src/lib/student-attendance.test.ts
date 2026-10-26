import { summarizeAttendance } from './student-attendance';

test('counts late arrivals as attended and sums only actual late minutes', () => {
  expect(summarizeAttendance([
    { attendance: 'PRESENT', lateMinutes: 15, performance: 'GOOD' },
    { attendance: 'LATE', lateMinutes: 7, performance: 'GOOD' },
    { attendance: 'ABSENT', lateMinutes: 0, performance: null },
    { attendance: 'EXCUSED', lateMinutes: 0, performance: null },
  ])).toEqual({ recorded: 4, attended: 2, absent: 1, excused: 1, late: 1, lateMinutes: 7, performance: { GOOD: 2 } });
});

test('an empty month does not invent absences', () => {
  expect(summarizeAttendance([])).toEqual({ recorded: 0, attended: 0, absent: 0, excused: 0, late: 0, lateMinutes: 0, performance: {} });
});

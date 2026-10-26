export function summarizeAttendance(records: { attendance: string; lateMinutes: number; performance: string | null }[]) {
  return {
    recorded: records.length,
    attended: records.filter(r => r.attendance === 'PRESENT' || r.attendance === 'LATE').length,
    absent: records.filter(r => r.attendance === 'ABSENT').length,
    excused: records.filter(r => r.attendance === 'EXCUSED').length,
    late: records.filter(r => r.attendance === 'LATE').length,
    lateMinutes: records.reduce((n,r) => n + (r.attendance === 'LATE' ? r.lateMinutes : 0), 0),
    performance: records.reduce<Record<string, number>>((counts,r) => { if (r.performance) counts[r.performance] = (counts[r.performance] || 0) + 1; return counts; }, {}),
  };
}

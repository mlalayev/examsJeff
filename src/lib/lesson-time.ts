/** Parse "17:00 - 18:00" (or similar) into duration in hours. */
export function parseLessonHours(timeSlot: string): number {
  const parts = timeSlot.split("-").map((p) => p.trim());
  if (parts.length < 2) return 1;
  const start = parseClock(parts[0]);
  const end = parseClock(parts[1]);
  if (start == null || end == null) return 1;
  let mins = end - start;
  if (mins <= 0) mins += 24 * 60;
  return mins / 60;
}

function parseClock(s: string): number | null {
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

import { parseLessonHours } from "@/lib/lesson-time";

type SlotLike = { dayType: "ODD" | "EVEN"; timeSlot: string };

/** How many lesson occurrences recurring slots would produce in a month (Sundays skipped). */
export function projectedLessonsForMonth(
  slots: SlotLike[],
  year: number,
  month: number
): number {
  if (slots.length === 0) return 0;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  let count = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const dateUtc = new Date(Date.UTC(year, month - 1, day));
    if (dateUtc.getUTCDay() === 0) continue;
    const wantType = day % 2 !== 0 ? "ODD" : "EVEN";
    count += slots.filter((s) => s.dayType === wantType).length;
  }
  return count;
}

export function projectedHoursForMonth(
  slots: SlotLike[],
  year: number,
  month: number
): number {
  if (slots.length === 0) return 0;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  let hours = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const dateUtc = new Date(Date.UTC(year, month - 1, day));
    if (dateUtc.getUTCDay() === 0) continue;
    const wantType = day % 2 !== 0 ? "ODD" : "EVEN";
    for (const slot of slots) {
      if (slot.dayType === wantType) hours += parseLessonHours(slot.timeSlot);
    }
  }
  return Math.round(hours * 100) / 100;
}

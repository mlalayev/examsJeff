import { scheduleReports } from "@/lib/schedule-parent-reports";
export const maxDuration = 120;
export async function POST(request: Request) {
  return scheduleReports(request, "day");
}

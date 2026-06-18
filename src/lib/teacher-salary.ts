import type { TeacherPayType } from "@prisma/client";

export type PaySetting = {
  payType: TeacherPayType;
  rate: number | null;
  fixedAmount: number | null;
};

export function computeTeacherPay(
  setting: PaySetting,
  lessonCount: number,
  totalHours: number
): number | null {
  switch (setting.payType) {
    case "PER_LESSON":
      return setting.rate != null ? setting.rate * lessonCount : null;
    case "HOURLY":
      return setting.rate != null ? setting.rate * totalHours : null;
    case "FIXED":
      return setting.fixedAmount;
    default:
      return null;
  }
}

export const PAY_TYPE_LABELS: Record<TeacherPayType, string> = {
  PER_LESSON: "Per lesson",
  HOURLY: "Hourly",
  FIXED: "Fixed monthly",
};

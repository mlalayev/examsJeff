import { Decimal } from "@prisma/client/runtime/library";

export type CommissionTier = {
  fromMonth: number;
  toMonth: number | null;
  percent: number;
};

export function parseCommissionTiers(raw: unknown): CommissionTier[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t) => {
      if (!t || typeof t !== "object") return null;
      const o = t as Record<string, unknown>;
      const fromMonth = Number(o.fromMonth);
      const toMonth =
        o.toMonth === null || o.toMonth === undefined ? null : Number(o.toMonth);
      const percent = Number(o.percent);
      if (!Number.isFinite(fromMonth) || fromMonth < 1) return null;
      if (toMonth !== null && (!Number.isFinite(toMonth) || toMonth < fromMonth))
        return null;
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) return null;
      return { fromMonth, toMonth, percent };
    })
    .filter((t): t is CommissionTier => t !== null)
    .sort((a, b) => a.fromMonth - b.fromMonth);
}

/** Month index since acceptance (1 = first paid month). */
export function monthIndexSinceAcceptance(
  acceptedAt: Date,
  paymentYear: number,
  paymentMonth: number
): number {
  const start = acceptedAt.getFullYear() * 12 + acceptedAt.getMonth();
  const pay = paymentYear * 12 + (paymentMonth - 1);
  return pay - start + 1;
}

export function percentForMonth(tiers: CommissionTier[], monthIndex: number): number {
  if (monthIndex < 1) return 0;
  for (const tier of tiers) {
    const inRange =
      monthIndex >= tier.fromMonth &&
      (tier.toMonth === null || monthIndex <= tier.toMonth);
    if (inRange) return tier.percent;
  }
  return 0;
}

export function decimalToNumber(value: Decimal | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return Number(value);
}

export function formatStudentName(
  firstName: string,
  lastName?: string | null
): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

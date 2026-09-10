import { z } from "zod";
import { catalogLabel } from "@/lib/portal-catalog";

export const CRM_STATUSES = [
  "WRITTEN",
  "CONSULTATION_BOOKED",
  "TRIAL_ATTENDED",
  "ENROLLED",
] as const;

export type CrmContactStatus = (typeof CRM_STATUSES)[number];

export const crmStatusSchema = z.enum(CRM_STATUSES);

export const CRM_STATUS_OPTIONS: Array<{ value: CrmContactStatus; label: string }> = [
  { value: "WRITTEN", label: "New inquiry" },
  { value: "CONSULTATION_BOOKED", label: "Consultation Booked" },
  { value: "TRIAL_ATTENDED", label: "Attended trial lesson" },
  { value: "ENROLLED", label: "Joined classes" },
];

export const createdBySelect = {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
  },
} as const;

export function mapCrmContact(row: {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  contactReason: string;
  status: CrmContactStatus;
  email: string | null;
  dateOfBirth: Date | null;
  notes: string | null;
  archivedAt: Date | null;
  firstContactedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}) {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    name: [row.firstName, row.lastName].filter(Boolean).join(" ").trim(),
    phoneNumber: row.phoneNumber,
    contactReason: row.contactReason,
    contactReasonLabel: catalogLabel(row.contactReason),
    status: row.status,
    email: row.email,
    dateOfBirth: row.dateOfBirth,
    notes: row.notes,
    archivedAt: row.archivedAt,
    firstContactedAt: row.firstContactedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy
      ? {
          id: row.createdBy.id,
          email: row.createdBy.email,
          name:
            [row.createdBy.firstName, row.createdBy.lastName]
              .filter(Boolean)
              .join(" ")
              .trim() || row.createdBy.email,
        }
      : null,
  };
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

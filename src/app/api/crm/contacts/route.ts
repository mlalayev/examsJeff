import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCrmManager } from "@/lib/auth-utils";

const crmStatuses = [
  "WRITTEN",
  "INFO_PROVIDED",
  "TRIAL_ATTENDED",
  "ENROLLED",
] as const;
const statusSchema = z.enum(crmStatuses);
type CrmContactStatus = (typeof crmStatuses)[number];

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().min(7, "Mobile number is required"),
  contactReason: z.string().min(1, "Contact reason is required"),
  status: statusSchema.default("WRITTEN"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  dateOfBirth: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || !Number.isNaN(Date.parse(value)),
      "Invalid date of birth"
    ),
  notes: z.string().optional(),
});

function mapContact(row: {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  contactReason: string;
  status: CrmContactStatus;
  email: string | null;
  dateOfBirth: Date | null;
  notes: string | null;
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
    status: row.status,
    email: row.email,
    dateOfBirth: row.dateOfBirth,
    notes: row.notes,
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

const createdBySelect = {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
  },
} as const;

export async function GET(request: Request) {
  try {
    await requireCrmManager();
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const requestedStatus = searchParams.get("status");

    const where: {
      OR?: Array<Record<string, unknown>>;
      status?: CrmContactStatus;
    } = {};

    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { phoneNumber: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { contactReason: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
      ];
    }

    if (requestedStatus) {
      const parsedStatus = statusSchema.safeParse(requestedStatus);
      if (!parsedStatus.success) {
        return NextResponse.json({ error: "Invalid CRM status" }, { status: 400 });
      }
      where.status = parsedStatus.data;
    }

    const contacts = await prisma.crmContact.findMany({
      where,
      include: { createdBy: createdBySelect },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    return NextResponse.json({
      contacts: contacts.map(mapContact),
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.startsWith("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    console.error("CRM contacts list error:", error);
    return NextResponse.json({ error: "Failed to load contacts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCrmManager();
    const body = await request.json();
    const data = contactSchema.parse(body);

    const contact = await prisma.crmContact.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phoneNumber: data.phoneNumber.trim(),
        contactReason: data.contactReason.trim(),
        status: data.status,
        email: data.email?.trim() || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        notes: data.notes?.trim() || null,
        createdById: (user as { id: string }).id,
      },
      include: { createdBy: createdBySelect },
    });

    return NextResponse.json(
      { message: "Contact created", contact: mapContact(contact) },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.startsWith("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    console.error("CRM contact create error:", error);
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }
}

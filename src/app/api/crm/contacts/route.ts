import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCrmManager } from "@/lib/auth-utils";
import {
  createdBySelect,
  crmStatusSchema,
  mapCrmContact,
  type CrmContactStatus,
} from "@/lib/crm";

const optionalEmail = z
  .union([z.string().email("Invalid email"), z.literal("")])
  .optional();

const optionalDate = z
  .union([
    z.literal(""),
    z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
  ])
  .optional();

const contactSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  phoneNumber: z.string().trim().min(7, "Mobile number is required (min 7 digits)"),
  contactReason: z.string().trim().min(1, "Contact interest / reason is required"),
  status: crmStatusSchema.default("WRITTEN"),
  email: optionalEmail,
  dateOfBirth: optionalDate,
  firstContactedAt: optionalDate,
  notes: z.string().optional(),
});

function parseYearMonth(yearRaw: string | null, monthRaw: string | null) {
  if (!yearRaw || !monthRaw) return null;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return { year, month, start, end };
}

export async function GET(request: Request) {
  try {
    await requireCrmManager();
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const requestedStatus = searchParams.get("status");
    const contactReason = (searchParams.get("contactReason") || "").trim();
    const archive = (searchParams.get("archive") || "active").toLowerCase();
    const summary = searchParams.get("summary") === "1";
    const yearRaw = searchParams.get("year");
    const monthRaw = searchParams.get("month");

    if (summary) {
      const year = yearRaw ? Number(yearRaw) : new Date().getFullYear();
      if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        return NextResponse.json({ error: "Invalid year" }, { status: 400 });
      }

      const start = new Date(Date.UTC(year, 0, 1));
      const end = new Date(Date.UTC(year + 1, 0, 1));

      const rows = await prisma.crmContact.findMany({
        where: { firstContactedAt: { gte: start, lt: end } },
        select: { firstContactedAt: true },
      });

      const months = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        count: 0,
      }));

      for (const row of rows) {
        months[row.firstContactedAt.getUTCMonth()].count += 1;
      }

      return NextResponse.json({ year, total: rows.length, months });
    }

    const where: Prisma.CrmContactWhereInput = {};

    if (archive === "archived") {
      where.archivedAt = { not: null };
    } else if (archive !== "all") {
      where.archivedAt = null;
    }

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
      const parsedStatus = crmStatusSchema.safeParse(requestedStatus);
      if (!parsedStatus.success) {
        return NextResponse.json({ error: "Invalid CRM status" }, { status: 400 });
      }
      where.status = parsedStatus.data;
    }

    if (contactReason) {
      const studyAbroadAliases = new Set([
        "Study Abroad / Xaricdə Təhsil",
        "Study Abroad",
        "STUDY_ABROAD",
      ]);
      if (studyAbroadAliases.has(contactReason)) {
        where.contactReason = { in: [...studyAbroadAliases] };
      } else {
        where.contactReason = contactReason;
      }
    }

    if (yearRaw || monthRaw) {
      const ym = parseYearMonth(yearRaw, monthRaw);
      if (!ym) {
        return NextResponse.json({ error: "Invalid year/month filter" }, { status: 400 });
      }
      where.firstContactedAt = { gte: ym.start, lt: ym.end };
    }

    const contacts = await prisma.crmContact.findMany({
      where,
      include: { createdBy: createdBySelect },
      orderBy: [{ firstContactedAt: "desc" }, { createdAt: "desc" }],
      take: 5000,
    });

    return NextResponse.json({
      contacts: contacts.map(mapCrmContact),
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

    const firstContactedAt =
      data.firstContactedAt && data.firstContactedAt !== ""
        ? new Date(data.firstContactedAt)
        : new Date();

    const contact = await prisma.crmContact.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phoneNumber: data.phoneNumber.trim(),
        contactReason: data.contactReason.trim(),
        status: data.status as CrmContactStatus,
        email: data.email?.trim() || null,
        dateOfBirth:
          data.dateOfBirth && data.dateOfBirth !== ""
            ? new Date(data.dateOfBirth)
            : null,
        notes: data.notes?.trim() || null,
        firstContactedAt,
        createdById: (user as { id: string }).id,
      },
      include: { createdBy: createdBySelect },
    });

    return NextResponse.json(
      { message: "Contact created", contact: mapCrmContact(contact) },
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
      if ("code" in error && (error as { code?: string }).code === "P2021") {
        return NextResponse.json(
          {
            error:
              "CRM database table is missing. Run pending Prisma migrations (crm_contacts).",
          },
          { status: 500 }
        );
      }
    }
    console.error("CRM contact create error:", error);
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
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
  .optional()
  .nullable();

const optionalDate = z
  .union([
    z.literal(""),
    z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
  ])
  .optional()
  .nullable();

const updateSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").optional(),
  lastName: z.string().trim().min(1, "Last name is required").optional(),
  phoneNumber: z
    .string()
    .trim()
    .min(7, "Mobile number is required (min 7 digits)")
    .optional(),
  contactReason: z
    .string()
    .trim()
    .min(1, "Contact interest / reason is required")
    .optional(),
  status: crmStatusSchema.optional(),
  email: optionalEmail,
  dateOfBirth: optionalDate,
  firstContactedAt: optionalDate,
  notes: z.string().optional().nullable(),
  archived: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireCrmManager();
    const { id } = await context.params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const existing = await prisma.crmContact.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const contact = await prisma.crmContact.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName.trim() }),
        ...(data.lastName !== undefined && { lastName: data.lastName.trim() }),
        ...(data.phoneNumber !== undefined && {
          phoneNumber: data.phoneNumber.trim(),
        }),
        ...(data.contactReason !== undefined && {
          contactReason: data.contactReason.trim(),
        }),
        ...(data.status !== undefined && {
          status: data.status as CrmContactStatus,
        }),
        ...(data.email !== undefined && {
          email: data.email?.trim() || null,
        }),
        ...(data.dateOfBirth !== undefined && {
          dateOfBirth:
            data.dateOfBirth && data.dateOfBirth !== ""
              ? new Date(data.dateOfBirth)
              : null,
        }),
        ...(data.firstContactedAt !== undefined &&
          data.firstContactedAt !== null &&
          data.firstContactedAt !== "" && {
            firstContactedAt: new Date(data.firstContactedAt),
          }),
        ...(data.notes !== undefined && {
          notes: data.notes?.trim() || null,
        }),
        ...(data.archived === true && { archivedAt: new Date() }),
        ...(data.archived === false && { archivedAt: null }),
      },
      include: { createdBy: createdBySelect },
    });

    return NextResponse.json({
      message: "Contact updated",
      contact: mapCrmContact(contact),
    });
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
    console.error("CRM contact update error:", error);
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireCrmManager();
    const { id } = await context.params;

    const existing = await prisma.crmContact.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    await prisma.crmContact.update({
      where: { id },
      data: { archivedAt: existing.archivedAt ?? new Date() },
    });

    return NextResponse.json({ message: "Contact archived", archived: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.startsWith("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    console.error("CRM contact archive error:", error);
    return NextResponse.json({ error: "Failed to archive contact" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCrmManager } from "@/lib/auth-utils";

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phoneNumber: z.string().min(7).optional(),
  contactReason: z.string().min(1).optional(),
  hasWritten: z.boolean().optional(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  dateOfBirth: z
    .string()
    .optional()
    .or(z.literal(""))
    .nullable()
    .refine(
      (value) => value == null || value === "" || !Number.isNaN(Date.parse(value)),
      "Invalid date of birth"
    ),
  notes: z.string().optional().nullable(),
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
        ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber.trim() }),
        ...(data.contactReason !== undefined && {
          contactReason: data.contactReason.trim(),
        }),
        ...(data.hasWritten !== undefined && { hasWritten: data.hasWritten }),
        ...(data.email !== undefined && {
          email: data.email?.trim() || null,
        }),
        ...(data.dateOfBirth !== undefined && {
          dateOfBirth:
            data.dateOfBirth && data.dateOfBirth !== ""
              ? new Date(data.dateOfBirth)
              : null,
        }),
        ...(data.notes !== undefined && {
          notes: data.notes?.trim() || null,
        }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Contact updated",
      contact: {
        ...contact,
        name: [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim(),
      },
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

    await prisma.crmContact.delete({ where: { id } });
    return NextResponse.json({ message: "Contact deleted" });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.startsWith("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    console.error("CRM contact delete error:", error);
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}

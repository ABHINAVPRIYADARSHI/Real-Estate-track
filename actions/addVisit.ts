"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { VisitStatus } from "@prisma/client";

const AddVisitSchema = z.object({
  customerId: z.string().min(1),
  projectName: z.string().min(1).max(200),
  dateTime: z
    .string()
    .min(10, "Date/time is required")
    .refine((s) => !Number.isNaN(new Date(s).getTime()), "Invalid date/time"),
  status: z.nativeEnum(VisitStatus),
  assignedSalesmanId: z.string().min(1).optional(),
});

export async function addVisitAction(input: {
  customerId: string;
  projectName: string;
  dateTime: string;
  status: VisitStatus;
  assignedSalesmanId?: string;
}) {
  const parsed = AddVisitSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const currentUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true, role: true, status: true },
  });

  if (!currentUser || currentUser.status !== "Active" || !currentUser.role) {
    throw new Error("Not authorized");
  }

  const customer = await prisma.customer.findUnique({
    where: { id: parsed.data.customerId },
    include: { owner: true },
  });

  if (!customer) throw new Error("Customer not found");

  const assignedDate = new Date(parsed.data.dateTime);

  const role = currentUser.role;

  let assignedSalesmanId: string;

  if (role === "Salesman") {
    if (customer.ownerUserId !== currentUser.id) {
      throw new Error("You can only add visits for your owned leads");
    }
    if (!customer.owner || customer.owner.status !== "Active" || customer.owner.role !== "Salesman") {
      throw new Error("Lead owner is not active");
    }
    assignedSalesmanId = currentUser.id;
  } else if (role === "Manager") {
    if (
      !customer.owner ||
      customer.owner.role !== "Salesman" ||
      customer.owner.status !== "Active" ||
      customer.owner.managerId !== currentUser.id
    ) {
      throw new Error("You can only add visits for your team’s leads");
    }
    if (!parsed.data.assignedSalesmanId) {
      throw new Error("Assigned salesman is required");
    }
    assignedSalesmanId = parsed.data.assignedSalesmanId;
  } else {
    // Admin
    if (!parsed.data.assignedSalesmanId) {
      throw new Error("Assigned salesman is required");
    }
    assignedSalesmanId = parsed.data.assignedSalesmanId;
  }

  // Validate assigned salesman
  const assignedSalesman = await prisma.user.findUnique({
    where: { id: assignedSalesmanId },
    select: { id: true, role: true, status: true },
  });

  if (
    !assignedSalesman ||
    assignedSalesman.status !== "Active" ||
    assignedSalesman.role !== "Salesman"
  ) {
    throw new Error("Assigned salesman is not active");
  }

  // Manager/Admin may delegate to any salesman; permissions on customer are enforced above.
  const visit = await prisma.visit.create({
    data: {
      customerId: customer.id,
      projectName: parsed.data.projectName,
      dateTime: assignedDate,
      status: parsed.data.status,
      assignedSalesmanId,
    },
  });

  return { ok: true, visitId: visit.id };
}


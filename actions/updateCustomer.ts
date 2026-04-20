"use server";

import { getAuthenticatedUser } from "@/lib/auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const UpdateCustomerSchema = z.object({
  customerId: z.string().min(1),
  name: z.string().min(1, "Name is required").max(200).optional(),
  mobileNumber: z
    .string()
    .min(7, "Mobile number must be at least 7 digits")
    .max(20)
    .optional(),
  newOwnerUserId: z.string().min(1).optional(),
});

export async function updateCustomerAction(input: {
  customerId: string;
  name?: string;
  mobileNumber?: string;
  newOwnerUserId?: string;
}) {
  const parsed = UpdateCustomerSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const currentUser = await getAuthenticatedUser();
  if (currentUser.status !== "Active" || !currentUser.role) {
    throw new Error("Not authorized");
  }

  const dbUserId = currentUser.dbUserId;

  // Only Admin and Manager can reassign owner
  if (parsed.data.newOwnerUserId && currentUser.role === "Salesman") {
    throw new Error("Salesmen cannot reassign customers");
  }

  const customer = await prisma.customer.findUnique({
    where: { id: parsed.data.customerId },
    include: { owner: { select: { id: true, managerId: true, role: true } } },
  });

  if (!customer) throw new Error("Customer not found");

  // Check access: Salesman can only edit their own customers
  if (currentUser.role === "Salesman" && customer.ownerUserId !== dbUserId) {
    throw new Error("You don't have access to this customer");
  }

  // Check access: Manager can only edit customers in their team
  if (currentUser.role === "Manager") {
    const ownerInfo = customer.owner;
    if (ownerInfo.role !== "Salesman" || ownerInfo.managerId !== dbUserId) {
      throw new Error("You don't have access to this customer");
    }
  }

  // If reassigning, validate new owner exists and is in scope
  let newOwnerName: string | null | undefined = undefined;
  if (parsed.data.newOwnerUserId) {
    const newOwner = await prisma.user.findUnique({
      where: { id: parsed.data.newOwnerUserId },
      select: { id: true, role: true, status: true, displayName: true, managerId: true },
    });

    if (!newOwner || newOwner.role !== "Salesman" || newOwner.status !== "Active") {
      throw new Error("New owner must be an active salesman");
    }

    // Manager can only reassign within their team
    if (currentUser.role === "Manager" && newOwner.managerId !== dbUserId) {
      throw new Error("You can only reassign to salesmen in your team");
    }

    newOwnerName = newOwner.displayName ?? null;
  }

  // Check for mobile number uniqueness if changing it
  if (
    parsed.data.mobileNumber &&
    parsed.data.mobileNumber !== customer.mobileNumber
  ) {
    const existing = await prisma.customer.findUnique({
      where: { mobileNumber: parsed.data.mobileNumber },
    });
    if (existing) {
      throw new Error("This mobile number is already registered to another customer");
    }
  }

  await prisma.customer.update({
    where: { id: parsed.data.customerId },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.mobileNumber ? { mobileNumber: parsed.data.mobileNumber } : {}),
      ...(parsed.data.newOwnerUserId
        ? { ownerUserId: parsed.data.newOwnerUserId, ownerName: newOwnerName }
        : {}),
    },
  });

  return { ok: true };
}

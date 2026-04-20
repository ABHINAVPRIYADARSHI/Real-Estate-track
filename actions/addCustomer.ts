"use server";

import { getAuthenticatedUser } from "@/lib/auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const AddCustomerSchema = z.object({
  mobileNumber: z
    .string()
    .min(7, "Mobile number is required")
    .max(20, "Mobile number is too long"),
  name: z.string().min(1, "Customer name is required").max(200),
  ownerUserId: z.string().optional(), // Only sent by Admin/Manager
});

export async function addCustomerAction(input: {
  mobileNumber: string;
  name: string;
  ownerUserId?: string;
}) {
  const parsed = AddCustomerSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const currentUser = await getAuthenticatedUser();
  if (currentUser.status !== "Active" || !currentUser.role) {
    throw new Error("You do not have permission to add customers");
  }

  let ownerUserId: string;
  let ownerName: string | null;

  if (currentUser.role === "Salesman") {
    // Salesman always owns their own customer — ignore any incoming ownerUserId
    const dbUser = await prisma.user.findUnique({
      where: { id: currentUser.dbUserId },
      select: { displayName: true },
    });
    ownerUserId = currentUser.dbUserId;
    ownerName = dbUser?.displayName ?? null;
  } else {
    // Admin / Manager — must have selected a salesman
    const selectedId = parsed.data.ownerUserId;
    if (!selectedId) {
      throw new Error("Please select a salesman to assign this customer to.");
    }

    // Validate the selected salesman exists and is reachable by the caller
    const owner = await prisma.user.findUnique({
      where: { id: selectedId },
      select: {
        id: true,
        displayName: true,
        role: true,
        status: true,
        managerId: true,
      },
    });

    if (!owner || owner.status !== "Active" || owner.role !== "Salesman") {
      throw new Error("Selected salesman is not valid or not active.");
    }

    // Manager can only assign to their own team
    if (
      currentUser.role === "Manager" &&
      owner.managerId !== currentUser.dbUserId
    ) {
      throw new Error("You can only assign customers to salesmen in your team.");
    }

    ownerUserId = owner.id;
    ownerName = owner.displayName ?? null;
  }

  // Duplicate mobile check
  const existing = await prisma.customer.findUnique({
    where: { mobileNumber: parsed.data.mobileNumber },
    include: { owner: { select: { displayName: true } } },
  });

  if (existing) {
    const existingOwnerName =
      existing.owner.displayName ?? existing.ownerName ?? "another user";
    throw new Error(`This lead is already registered to ${existingOwnerName}.`);
  }

  try {
    const created = await prisma.customer.create({
      data: {
        ownerUserId,
        ownerName,
        mobileNumber: parsed.data.mobileNumber,
        name: parsed.data.name,
      },
    });

    return { ok: true, customerId: created.id };
  } catch (err: any) {
    // Race condition — two users creating same mobile simultaneously
    if (err?.code === "P2002") {
      const existingAfterRace = await prisma.customer.findUnique({
        where: { mobileNumber: parsed.data.mobileNumber },
        include: { owner: { select: { displayName: true } } },
      });
      const raceOwnerName =
        existingAfterRace?.owner.displayName ??
        existingAfterRace?.ownerName ??
        "another user";
      throw new Error(`This lead is already registered to ${raceOwnerName}.`);
    }
    throw err;
  }
}

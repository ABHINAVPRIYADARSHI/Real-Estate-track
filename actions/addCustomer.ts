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
  ownerUserId: z.string().optional(),
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

  const authUser = await getAuthenticatedUser();
  const currentUser = await prisma.user.findUnique({
    where: { id: authUser.dbUserId },
    select: { id: true, status: true, role: true, displayName: true },
  });

  if (!currentUser || currentUser.status !== "Active" || !currentUser.role) {
    throw new Error("You do not have permission to add customers");
  }

  let ownerUserId = currentUser.id;
  let ownerName = currentUser.displayName ?? null;

  if (currentUser.role !== "Salesman") {
    // If a specific salesman was chosen via the form UI, use them.
    if (parsed.data.ownerUserId) {
      const owner = await prisma.user.findUnique({
        where: { id: parsed.data.ownerUserId },
        select: { id: true, displayName: true, role: true, status: true, managerId: true },
      });

      if (!owner || owner.role !== "Salesman" || owner.status !== "Active") {
        throw new Error("Selected salesman is not valid.");
      }

      if (currentUser.role === "Manager" && owner.managerId !== currentUser.id) {
        throw new Error("You can only assign customers to your own team members.");
      }

      ownerUserId = owner.id;
      ownerName = owner.displayName ?? null;
    } else {
      // Fallback: auto-pick the first available salesman.
      const owner =
        currentUser.role === "Manager"
          ? await prisma.user.findFirst({
              where: {
                role: "Salesman",
                status: "Active",
                managerId: currentUser.id,
              },
              orderBy: { createdAt: "asc" },
              select: { id: true, displayName: true },
            })
          : await prisma.user.findFirst({
              where: {
                role: "Salesman",
                status: "Active",
              },
              orderBy: { createdAt: "asc" },
              select: { id: true, displayName: true },
            });

      if (!owner) {
        throw new Error(
          currentUser.role === "Manager"
            ? "No active salesman found in your team. Ask Admin to activate one first."
            : "No active salesman found. Create or activate a salesman first."
        );
      }

      ownerUserId = owner.id;
      ownerName = owner.displayName ?? null;
    }
  }

  const existing = await prisma.customer.findUnique({
    where: { mobileNumber: parsed.data.mobileNumber },
    include: {
      owner: {
        select: { displayName: true },
      },
    },
  });

  if (existing) {
    const ownerName =
      existing.owner.displayName ??
      existing.ownerName ??
      "this user";

    throw new Error(
      `This lead is already registered to ${ownerName}.`
    );
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
    // Handle race conditions where two salesmen create the same mobile simultaneously.
    if (err?.code === "P2002") {
      const existingAfterRace = await prisma.customer.findUnique({
        where: { mobileNumber: parsed.data.mobileNumber },
        include: { owner: { select: { displayName: true } } },
      });

      const ownerName =
        existingAfterRace?.owner.displayName ??
        existingAfterRace?.ownerName ??
        "this user";

      throw new Error(
        `This lead is already registered to ${ownerName}.`
      );
    }

    throw err;
  }
}


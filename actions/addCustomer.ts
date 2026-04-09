"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const AddCustomerSchema = z.object({
  mobileNumber: z
    .string()
    .min(7, "Mobile number is required")
    .max(20, "Mobile number is too long"),
  name: z.string().min(1, "Customer name is required").max(200),
});

export async function addCustomerAction(input: {
  mobileNumber: string;
  name: string;
}) {
  const parsed = AddCustomerSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const currentUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true, status: true, role: true, displayName: true },
  });

  if (!currentUser || currentUser.status !== "Active" || !currentUser.role) {
    throw new Error("You do not have permission to add customers");
  }

  let ownerUserId = currentUser.id;
  let ownerName = currentUser.displayName ?? null;

  if (currentUser.role !== "Salesman") {
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


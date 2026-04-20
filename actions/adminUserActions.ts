"use server";

import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role, UserStatus } from "@prisma/client";

async function requireActiveAdmin() {
  const currentUser = await getAuthenticatedUser();
  if (currentUser.status !== "Active" || currentUser.role !== "Admin") {
    throw new Error("Admin access required");
  }
  return currentUser;
}

export async function approvePendingUserAction(input: {
  userId: string;
  role: Role;
  managerId?: string | null;
}) {
  await requireActiveAdmin();

  const target = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, status: true, role: true, managerId: true },
  });

  if (!target) throw new Error("User not found");
  if (target.status !== "Pending") {
    throw new Error("Only Pending users can be approved");
  }

  if (input.role === "Salesman") {
    const managerId = input.managerId ?? null;
    if (!managerId) throw new Error("Manager is required for Salesman role");

    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      select: { id: true, role: true, status: true },
    });

    if (!manager || manager.status !== "Active" || manager.role !== "Manager") {
      throw new Error("Selected manager is not Active");
    }

    return prisma.user.update({
      where: { id: target.id },
      data: {
        status: "Active",
        role: "Salesman",
        managerId,
      },
    });
  }

  if (input.role === "Manager") {
    return prisma.user.update({
      where: { id: target.id },
      data: {
        status: "Active",
        role: "Manager",
        managerId: null,
      },
    });
  }

  // Admin role
  return prisma.user.update({
    where: { id: target.id },
    data: {
      status: "Active",
      role: "Admin",
      managerId: null,
    },
  });
}

export async function setUserStatusAction(input: {
  userId: string;
  status: UserStatus;
}) {
  await requireActiveAdmin();

  const target = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });
  if (!target) throw new Error("User not found");

  return prisma.user.update({
    where: { id: input.userId },
    data: {
      status: input.status,
    },
  });
}

"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export type SalesmanOption = {
  id: string;
  displayName: string | null;
};

/**
 * Returns the list of active salesmen the current user can assign customers to.
 * - Admin: all active salesmen
 * - Manager: active salesmen in their team
 * - Salesman: empty (cannot reassign)
 */
export async function getSalesmanListAction(): Promise<SalesmanOption[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const currentUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true, role: true, status: true },
  });

  if (!currentUser || currentUser.status !== "Active" || !currentUser.role) {
    throw new Error("Not authorized");
  }

  if (currentUser.role === "Salesman") return [];

  const salesmen = await prisma.user.findMany({
    where:
      currentUser.role === "Manager"
        ? { role: "Salesman", status: "Active", managerId: currentUser.id }
        : { role: "Salesman", status: "Active" },
    select: { id: true, displayName: true },
    orderBy: { displayName: "asc" },
  });

  return salesmen;
}

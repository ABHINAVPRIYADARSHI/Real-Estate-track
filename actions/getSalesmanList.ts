"use server";

import { getAuthenticatedUser } from "@/lib/auth";
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
  const currentUser = await getAuthenticatedUser();
  if (currentUser.status !== "Active" || !currentUser.role) {
    throw new Error("Not authorized");
  }

  if (currentUser.role === "Salesman") return [];

  const salesmen = await prisma.user.findMany({
    where:
      currentUser.role === "Manager"
        ? { role: "Salesman", status: "Active", managerId: currentUser.dbUserId }
        : { role: "Salesman", status: "Active" },
    select: { id: true, displayName: true },
    orderBy: { displayName: "asc" },
  });

  return salesmen;
}

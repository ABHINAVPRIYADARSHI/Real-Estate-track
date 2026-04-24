"use server";

import { getAuthenticatedUser } from "@/lib/auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const SearchCustomersSchema = z.object({
  query: z.string().trim().min(1, "Enter a name or mobile number"),
});

type CustomerSearchResult = {
  id: string;
  name: string;
  mobileNumber: string;
  ownerName: string | null;
};

export async function searchCustomersAction(input: {
  query: string;
}): Promise<CustomerSearchResult[]> {
  const parsed = SearchCustomersSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const authUser = await getAuthenticatedUser();
  const currentUser = { id: authUser.dbUserId, role: authUser.role, status: authUser.status };

  if (!currentUser.role) throw new Error("Not authorized");

  const q = parsed.data.query;

  const scopeWhere =
    currentUser.role === "Salesman"
      ? { ownerUserId: currentUser.id }
      : currentUser.role === "Manager"
        ? {
            owner: {
              managerId: currentUser.id,
              role: "Salesman",
              status: "Active",
            },
          }
        : {};

  // mobile search tends to be exact-ish; name search is case-insensitive
  const customers = await prisma.customer.findMany({
    where: {
      ...(scopeWhere as any),
      OR: [
        { mobileNumber: { contains: q } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 8,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      mobileNumber: true,
      ownerName: true,
    },
  });

  return customers;
}


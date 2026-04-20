"use server";

import { getAuthenticatedUser } from "@/lib/auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 15;

const GetCustomersSchema = z.object({
  query: z.string().trim().optional().default(""),
  page: z.number().int().min(1).default(1),
});

export type CustomerRow = {
  id: string;
  name: string;
  mobileNumber: string;
  ownerName: string | null;
  ownerUserId: string;
  createdAt: string;
  _count: { visits: number };
};

export type GetCustomersResult = {
  customers: CustomerRow[];
  totalCount: number;
  totalPages: number;
  page: number;
};

export async function getCustomersAction(input: {
  query?: string;
  page?: number;
}): Promise<GetCustomersResult> {
  const parsed = GetCustomersSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const currentUser = await getAuthenticatedUser();
  if (currentUser.status !== "Active" || !currentUser.role) {
    throw new Error("Not authorized");
  }

  const { query, page } = parsed.data;
  const skip = (page - 1) * PAGE_SIZE;

  // Scope by role
  const scopeWhere =
    currentUser.role === "Salesman"
      ? { ownerUserId: currentUser.dbUserId }
      : currentUser.role === "Manager"
        ? {
            owner: {
              managerId: currentUser.dbUserId,
              role: "Salesman" as const,
              status: "Active" as const,
            },
          }
        : {};

  // Search filter
  const searchWhere = query
    ? {
        OR: [
          { mobileNumber: { contains: query } },
          { name: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const where = { ...(scopeWhere as any), ...(searchWhere as any) };

  const [customers, totalCount] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        mobileNumber: true,
        ownerName: true,
        ownerUserId: true,
        createdAt: true,
        _count: { select: { visits: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    customers: customers.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    page,
  };
}

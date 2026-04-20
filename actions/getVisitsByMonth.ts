"use server";

import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getVisitsByMonthAction(input: {
  year: number;
  month: number; // 0-indexed (0 = January)
}) {
  const currentUser = await getAuthenticatedUser();
  if (currentUser.status !== "Active" || !currentUser.role) {
    throw new Error("Account not active");
  }

  const dbUserId = currentUser.dbUserId;

  const visitsWhere =
    currentUser.role === "Salesman"
      ? { assignedSalesmanId: dbUserId }
      : currentUser.role === "Manager"
        ? {
            customer: {
              owner: {
                managerId: dbUserId,
                role: "Salesman" as const,
                status: "Active" as const,
              },
            },
          }
        : {};

  const start = new Date(input.year, input.month, 1);
  const end = new Date(input.year, input.month + 1, 1);

  const visits = await prisma.visit.findMany({
    where: {
      ...(visitsWhere as any),
      dateTime: { gte: start, lt: end },
    },
    orderBy: { dateTime: "asc" },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          mobileNumber: true,
        },
      },
    },
  });

  return visits.map((v) => ({
    id: v.id,
    dateTime: v.dateTime.toISOString(),
    status: v.status,
    projectName: v.projectName,
    customer: v.customer,
  }));
}

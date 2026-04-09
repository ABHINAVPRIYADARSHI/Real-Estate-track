"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getVisitsByMonthAction(input: {
  year: number;
  month: number; // 0-indexed (0 = January)
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Login required");

  const currentUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true, role: true, status: true },
  });

  if (!currentUser || currentUser.status !== "Active" || !currentUser.role) {
    throw new Error("Account not active");
  }

  const visitsWhere =
    currentUser.role === "Salesman"
      ? { assignedSalesmanId: currentUser.id }
      : currentUser.role === "Manager"
        ? {
            customer: {
              owner: {
                managerId: currentUser.id,
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

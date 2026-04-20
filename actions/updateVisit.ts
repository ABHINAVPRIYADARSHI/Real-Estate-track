"use server";

import { getAuthenticatedUser } from "@/lib/auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const UpdateVisitSchema = z.object({
  visitId: z.string().min(1),
  status: z.enum(["Scheduled", "Completed", "Converted", "Cancelled"]),
  dateTime: z.string().datetime().optional(),
  projectId: z.string().optional(),
});

export async function updateVisitStatusAction(input: {
  visitId: string;
  status: "Scheduled" | "Completed" | "Converted" | "Cancelled";
  dateTime?: string;
  projectId?: string;
}) {
  const parsed = UpdateVisitSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const currentUser = await getAuthenticatedUser();
  if (currentUser.status !== "Active" || !currentUser.role) {
    throw new Error("Not authorized");
  }

  // Fetch the visit to verify ownership / permission
  const visit = await prisma.visit.findUnique({
    where: { id: parsed.data.visitId },
    select: {
      id: true,
      assignedSalesmanId: true,
      customer: {
        select: {
          ownerUserId: true,
          owner: { select: { managerId: true } },
        },
      },
    },
  });

  if (!visit) throw new Error("Visit not found");

  if (currentUser.role === "Salesman") {
    // Salesman can only update visits assigned to them
    if (visit.assignedSalesmanId !== currentUser.dbUserId) {
      throw new Error("You can only update your own visits");
    }
  } else if (currentUser.role === "Manager") {
    // Manager can update visits where the customer's owner is in their team
    const ownerManagerId = visit.customer.owner.managerId;
    if (ownerManagerId !== currentUser.dbUserId) {
      throw new Error("You can only update visits for your team's customers");
    }
  }
  // Admin: no restriction

  const data: { status: any; dateTime?: Date; projectId?: string } = {
    status: parsed.data.status,
  };
  if (parsed.data.dateTime) data.dateTime = new Date(parsed.data.dateTime);
  if (parsed.data.projectId) data.projectId = parsed.data.projectId;

  await prisma.visit.update({
    where: { id: parsed.data.visitId },
    data,
  });

  return { ok: true };
}

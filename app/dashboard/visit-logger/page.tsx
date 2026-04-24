import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import VisitLoggerForm from "@/components/visit-logger/VisitLoggerForm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VisitLoggerPage() {
  let authUser: Awaited<ReturnType<typeof getAuthenticatedUser>>;
  try {
    authUser = await getAuthenticatedUser();
  } catch {
    redirect("/sign-in");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: authUser!.dbUserId },
    select: { id: true, role: true, status: true },
  });

  if (!currentUser || currentUser.status !== "Active" || !currentUser.role) {
    redirect("/blocked/pending");
  }

  const salesmen =
    currentUser.role === "Salesman"
      ? []
      : await prisma.user.findMany({
          where: { role: "Salesman", status: "Active" },
          select: { id: true, displayName: true, status: true },
          orderBy: { displayName: "asc" },
        });

  // Fetch customers based on role
  const customers = await prisma.customer.findMany({
    where:
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
          : {},
    select: { id: true, name: true, mobileNumber: true },
    orderBy: { name: "asc" },
  });

  // Fetch active projects for the dropdown
  const projects = await prisma.project.findMany({
    where: { isActive: true },
    select: { id: true, name: true, location: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <VisitLoggerForm
        role={currentUser.role as Role}
        salesmen={salesmen}
        customers={customers}
        projects={projects}
      />
    </div>
  );
}


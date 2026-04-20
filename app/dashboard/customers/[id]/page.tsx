import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getSalesmanListAction } from "@/actions/getSalesmanList";
import CustomerDetailClient from "./CustomerDetailClient";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const currentUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { id: true, role: true, status: true },
  });

  if (!currentUser || currentUser.status !== "Active" || !currentUser.role) {
    redirect("/blocked/pending");
  }

  // Fetch customer with visit history
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, displayName: true, managerId: true, role: true } },
      visits: {
        orderBy: { dateTime: "desc" },
        take: 50,
        select: {
          id: true,
          dateTime: true,
          status: true,
          projectName: true,
          assignedSalesman: { select: { id: true, displayName: true } },
        },
      },
    },
  });

  if (!customer) notFound();

  // Scope check
  if (currentUser.role === "Salesman" && customer.ownerUserId !== currentUser.id) {
    notFound();
  }
  if (currentUser.role === "Manager") {
    if (
      customer.owner.role !== "Salesman" ||
      customer.owner.managerId !== currentUser.id
    ) {
      notFound();
    }
  }

  // Fetch salesman options for reassignment (empty for Salesmen)
  const salesmanOptions = await getSalesmanListAction();

  return (
    <CustomerDetailClient
      customer={{
        id: customer.id,
        name: customer.name,
        mobileNumber: customer.mobileNumber,
        ownerUserId: customer.ownerUserId,
        ownerName: customer.owner.displayName ?? customer.ownerName ?? null,
        createdAt: customer.createdAt.toISOString(),
      }}
      visits={customer.visits.map((v) => ({
        id: v.id,
        dateTime: v.dateTime.toISOString(),
        status: v.status,
        projectName: v.projectName,
        salesmanName: v.assignedSalesman.displayName ?? null,
      }))}
      salesmanOptions={salesmanOptions}
      canReassign={currentUser.role !== "Salesman"}
    />
  );
}

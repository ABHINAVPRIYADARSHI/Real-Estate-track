import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AddCustomerForm from "@/components/customer/AddCustomerForm";

export const dynamic = "force-dynamic";

export default async function AddCustomerPage() {
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

  // For Salesmen, skip the DB query — they always own their own customers
  let salesmen: { id: string; displayName: string | null }[] = [];

  if (currentUser.role !== "Salesman") {
    salesmen = await prisma.user.findMany({
      where:
        currentUser.role === "Manager"
          ? { role: "Salesman", status: "Active", managerId: currentUser.id }
          : { role: "Salesman", status: "Active" },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
    });
  }

  return <AddCustomerForm role={currentUser.role} salesmen={salesmen} />;
}

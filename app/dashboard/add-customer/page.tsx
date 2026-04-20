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
    select: { role: true, status: true },
  });

  if (!currentUser || currentUser.status !== "Active" || !currentUser.role) {
    redirect("/blocked/pending");
  }

  return <AddCustomerForm role={currentUser.role} />;
}

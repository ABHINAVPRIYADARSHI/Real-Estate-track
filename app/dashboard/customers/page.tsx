import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getCustomersAction } from "@/actions/getCustomers";
import Link from "next/link";
import CustomersClient from "./CustomersClient";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
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

  const query = searchParams.q ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const data = await getCustomersAction({ query, page });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-tertiary dark:text-white">Customers</h1>
        <Link href="/dashboard/add-customer" className="btn-primary py-2">
          + Add Customer
        </Link>
      </div>

      <CustomersClient
        initialData={data}
        initialQuery={query}
        initialPage={page}
      />
    </div>
  );
}

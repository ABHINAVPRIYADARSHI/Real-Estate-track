import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AccountMenu from "@/components/account/AccountMenu";

export default async function HeaderAccountSection() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:hover:bg-neutral-900"
      >
        Sign in
      </Link>
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { displayName: true, email: true, role: true, status: true },
  });

  const name = dbUser?.displayName ?? user.user_metadata?.full_name ?? "Signed-in user";
  const email = dbUser?.email ?? user.email ?? "No email available";
  const roleLabel = dbUser?.role ?? "Not assigned";
  const statusLabel = dbUser?.status ?? "Pending";
  const canManageUsers = dbUser?.status === "Active" && dbUser?.role === "Admin";

  return (
    <AccountMenu
      name={name}
      email={email}
      roleLabel={roleLabel}
      statusLabel={statusLabel}
      canManageUsers={canManageUsers}
    />
  );
}
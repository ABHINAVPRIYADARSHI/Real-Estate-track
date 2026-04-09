import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AccountMenu from "@/components/account/AccountMenu";

export default async function HeaderAccountSection() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <Link
        href="/sign-in"
        className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:hover:bg-neutral-900"
      >
        Sign in
      </Link>
    );
  }

  const [dbUser, clerkUser] = await Promise.all([
    prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: {
        displayName: true,
        role: true,
        status: true,
      },
    }),
    currentUser(),
  ]);

  const name =
    dbUser?.displayName ??
    clerkUser?.fullName ??
    clerkUser?.username ??
    "Signed-in user";
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ?? "No email available";
  const roleLabel = dbUser?.role ?? "Not assigned";
  const statusLabel = dbUser?.status ?? "Pending";
  const canManageUsers =
    dbUser?.status === "Active" && dbUser?.role === "Admin";

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
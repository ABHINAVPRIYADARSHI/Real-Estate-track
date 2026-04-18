import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import SideNav from "@/components/SideNav";

export default async function HeaderSideNavSection() {
  const { userId } = await auth();

  if (!userId) {
    // Not logged in — render a minimal placeholder (no nav needed)
    return null;
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
  const canManageProjects =
    dbUser?.status === "Active" && dbUser?.role === "Admin";

  return (
    <SideNav
      name={name}
      email={email}
      roleLabel={roleLabel}
      statusLabel={statusLabel}
      canManageUsers={canManageUsers}
      canManageProjects={canManageProjects}
    />
  );
}

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import SideNav from "@/components/SideNav";

export default async function HeaderSideNavSection() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { displayName: true, email: true, role: true, status: true },
  });

  const name = dbUser?.displayName ?? user.user_metadata?.full_name ?? "Signed-in user";
  const email = dbUser?.email ?? user.email ?? "No email available";
  const roleLabel = dbUser?.role ?? "Not assigned";
  const statusLabel = dbUser?.status ?? "Pending";
  const canManageUsers = dbUser?.status === "Active" && dbUser?.role === "Admin";
  const canManageProjects = dbUser?.status === "Active" && dbUser?.role === "Admin";

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

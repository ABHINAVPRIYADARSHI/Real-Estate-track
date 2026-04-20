import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import UserManagement from "@/components/admin/UserManagement";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UserManagementPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const admin = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { id: true, role: true, status: true },
  });

  if (!admin || admin.status !== "Active" || admin.role !== "Admin") {
    redirect("/dashboard");
  }

  const [users, managers] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        authId: true,
        displayName: true,
        email: true,
        role: true,
        status: true,
        managerId: true,
      },
    }),
    prisma.user.findMany({
      where: { role: "Manager", status: "Active" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        authId: true,
        displayName: true,
        email: true,
        role: true,
        status: true,
        managerId: true,
      },
    }),
  ]);

  return <UserManagement users={users} managers={managers} />;
}

import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UserManagement from "@/components/admin/UserManagement";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UserManagementPage() {
  let authUser: Awaited<ReturnType<typeof getAuthenticatedUser>>;
  try {
    authUser = await getAuthenticatedUser();
  } catch {
    redirect("/sign-in");
  }

  const admin = await prisma.user.findUnique({
    where: { id: authUser!.dbUserId },
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

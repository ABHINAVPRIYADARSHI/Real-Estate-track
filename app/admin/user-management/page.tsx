import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import UserManagement from "@/components/admin/UserManagement";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UserManagementPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const admin = await prisma.user.findUnique({
    where: { clerkUserId: userId },
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
        clerkUserId: true,
        displayName: true,
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
        clerkUserId: true,
        displayName: true,
        role: true,
        status: true,
        managerId: true,
      },
    }),
  ]);

  return <UserManagement users={users} managers={managers} />;
}


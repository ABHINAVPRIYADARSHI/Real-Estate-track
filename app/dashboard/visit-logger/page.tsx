import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import VisitLoggerForm from "@/components/visit-logger/VisitLoggerForm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VisitLoggerPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const currentUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true, role: true, status: true },
  });

  if (!currentUser || currentUser.status !== "Active" || !currentUser.role) {
    redirect("/blocked/pending");
  }

  const salesmen =
    currentUser.role === "Salesman"
      ? []
      : await prisma.user.findMany({
          where: { role: "Salesman", status: "Active" },
          select: { id: true, displayName: true, status: true },
          orderBy: { displayName: "asc" },
        });

  return (
    <div className="space-y-4">
      <VisitLoggerForm role={currentUser.role} salesmen={salesmen} />
    </div>
  );
}


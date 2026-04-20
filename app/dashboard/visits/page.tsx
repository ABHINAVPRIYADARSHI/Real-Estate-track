import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import FullCalendar from "@/components/calendar/FullCalendar";

export const dynamic = "force-dynamic";

export default async function VisitsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const currentUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { id: true, role: true, status: true, managerId: true },
  });

  if (!currentUser || currentUser.status !== "Active" || !currentUser.role) {
    redirect("/blocked/pending");
  }

  const visitsWhere =
    currentUser.role === "Salesman"
      ? { assignedSalesmanId: currentUser.id }
      : currentUser.role === "Manager"
        ? {
            customer: {
              owner: {
                managerId: currentUser.id,
                role: "Salesman",
                status: "Active",
              },
            },
          }
        : {};

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const start = new Date(currentYear, currentMonth, 1);
  const end = new Date(currentYear, currentMonth + 1, 1);

  const agenda = await prisma.visit.findMany({
    orderBy: { dateTime: "asc" },
    where: {
      ...(visitsWhere as any),
      dateTime: { gte: start, lt: end },
    },
    take: 100,
    include: {
      customer: {
        select: { id: true, name: true, mobileNumber: true },
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-tertiary dark:text-white">Visits</h1>
        <Link href="/dashboard/visit-logger" className="btn-primary py-2">
          + Log Visit
        </Link>
      </div>
      <FullCalendar
        initialVisits={agenda.map((v: any) => ({
          id: v.id,
          dateTime: v.dateTime.toISOString(),
          status: v.status,
          projectName: v.projectName,
          customer: v.customer,
        }))}
        initialYear={currentYear}
        initialMonth={currentMonth}
      />
    </div>
  );
}

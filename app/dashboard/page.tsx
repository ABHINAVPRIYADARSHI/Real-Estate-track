import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FullCalendar from "@/components/calendar/FullCalendar";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function formatPercent(n: number) {
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n * 100)}%`;
}

export default async function DashboardPage() {
  let authUser: Awaited<ReturnType<typeof getAuthenticatedUser>>;
  try {
    authUser = await getAuthenticatedUser();
  } catch {
    redirect("/sign-in");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: authUser!.dbUserId },
    select: {
      id: true,
      role: true,
      status: true,
      managerId: true,
      displayName: true,
    },
  });

  if (!currentUser || currentUser.status !== "Active") {
    return (
      <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        Your account is not active. Please wait for Admin approval.
      </div>
    );
  }

  if (!currentUser.role) {
    return (
      <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        Your role has not been assigned yet. Please contact an Admin.
      </div>
    );
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

  const [totalVisits, convertedVisits, agenda] = await Promise.all([
    prisma.visit.count({ where: visitsWhere as any }),
    prisma.visit.count({
      where: { ...(visitsWhere as any), status: "Converted" },
    }),
    prisma.visit.findMany({
      orderBy: { dateTime: "asc" },
      where: {
        ...(visitsWhere as any),
        dateTime: {
          gte: start,
          lt: end,
        },
      },
      take: 100,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            mobileNumber: true,
          },
        },
      },
    }),
  ]);

  const adminPendingData =
    currentUser.role === "Admin"
      ? await Promise.all([
          prisma.user.count({ where: { status: "Pending" } }),
          prisma.user.findMany({
            where: { status: "Pending" },
            orderBy: { createdAt: "asc" },
            take: 6,
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          }),
        ])
      : null;

  const pendingCount = adminPendingData?.[0] ?? 0;
  const pendingUsers = adminPendingData?.[1] ?? [];

  const conversionRate =
    totalVisits > 0 ? convertedVisits / totalVisits : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="text-sm text-neutral-600 dark:text-neutral-300">
          Conversion Rate
        </div>
        <div className="mt-1 text-3xl font-semibold">
          {formatPercent(conversionRate)}
        </div>
        <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Converted {convertedVisits} / Total {totalVisits}
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href="/dashboard/add-customer"
          className="btn-secondary flex-1 py-3 text-center text-sm"
        >
          Add Customer
        </Link>
        <Link
          href="/dashboard/visit-logger"
          className="btn-primary flex-1 py-3 text-center text-sm"
        >
          Schedule Visit
        </Link>
      </div>

      {currentUser.role === "Admin" ? (
        <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-300">
                Pending approvals
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {pendingCount}
              </div>
            </div>
            <Link
              href="/admin/user-management"
              className="rounded-md border border-neutral-200 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
            >
              Open approvals
            </Link>
          </div>

          <div className="mt-3 space-y-1.5 text-sm">
            {pendingUsers.length === 0 ? (
              <div className="text-neutral-500 dark:text-neutral-400">
                No users are waiting for approval.
              </div>
            ) : (
              pendingUsers.map((pendingUser) => (
                <div
                  key={pendingUser.id}
                  className="truncate rounded-md bg-neutral-50 px-2 py-1.5 dark:bg-neutral-900"
                >
                  {pendingUser.displayName ?? pendingUser.email ?? pendingUser.id}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

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


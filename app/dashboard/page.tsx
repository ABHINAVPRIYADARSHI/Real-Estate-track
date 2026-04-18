import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function formatPercent(n: number) {
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n * 100)}%`;
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const currentUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
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

  const [totalVisits, convertedVisits] = await Promise.all([
    prisma.visit.count({ where: visitsWhere as any }),
    prisma.visit.count({
      where: { ...(visitsWhere as any), status: "Converted" },
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
              clerkUserId: true,
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
      {/* Conversion rate card */}
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

      {/* Primary action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/dashboard/add-customer"
          className="flex flex-col items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-4 text-center text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-900"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          Add Customer
        </Link>
        <Link
          href="/dashboard/visit-logger"
          className="flex flex-col items-center gap-1.5 rounded-xl bg-neutral-900 px-3 py-4 text-center text-sm font-medium text-white transition-colors hover:opacity-90 dark:bg-neutral-50 dark:text-neutral-900"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Log Visit
        </Link>
      </div>

      {/* Navigation cards */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/dashboard/customers"
          className="flex flex-col items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-4 text-center text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-900"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Customers
        </Link>
        <Link
          href="/dashboard/visits"
          className="flex flex-col items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-4 text-center text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-900"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Visits
        </Link>
      </div>

      {/* Admin: pending approvals */}
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
                  {pendingUser.displayName ?? pendingUser.clerkUserId}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

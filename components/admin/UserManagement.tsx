"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Role, UserStatus } from "@prisma/client";
import { approvePendingUserAction, setUserStatusAction } from "@/actions/adminUserActions";

type DbUser = {
  id: string;
  clerkUserId: string;
  displayName: string | null;
  role: Role | null;
  status: UserStatus;
  managerId: string | null;
};

export default function UserManagement(props: { users: DbUser[]; managers: DbUser[] }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const managerById = useMemo(() => {
    const map = new Map<string, DbUser>();
    for (const m of props.managers) map.set(m.id, m);
    return map;
  }, [props.managers]);

  const pendingDefaults = useMemo(() => {
    const firstManagerId = props.managers[0]?.id ?? null;
    const draft: Record<string, { role: Role; managerId: string | null }> = {};
    for (const u of props.users) {
      if (u.status !== "Pending") continue;
      draft[u.id] = { role: "Salesman", managerId: firstManagerId };
    }
    return draft;
  }, [props.users, props.managers]);

  const [draftById, setDraftById] = useState(pendingDefaults);

  function setDraft(userId: string, next: Partial<(typeof draftById)[string]>) {
    setDraftById((prev) => ({ ...prev, [userId]: { ...(prev[userId] ?? pendingDefaults[userId]), ...next } }));
  }

  async function onApprove(userId: string) {
    setError(null);
    const draft = draftById[userId];
    if (!draft) { setError("No role draft found for this user."); return; }
    if (draft.role === "Salesman" && !draft.managerId) { setError("Manager is required for Salesman approval."); return; }

    startTransition(async () => {
      try {
        await approvePendingUserAction({ userId, role: draft.role, managerId: draft.role === "Salesman" ? draft.managerId : null });
        router.refresh();
      } catch (e: any) { setError(e?.message ?? "Failed to approve user"); }
    });
  }

  async function onToggleSuspended(user: DbUser) {
    setError(null);
    const nextStatus: UserStatus = user.status === "Suspended" ? "Active" : "Suspended";
    startTransition(async () => {
      try {
        await setUserStatusAction({ userId: user.id, status: nextStatus });
        router.refresh();
      } catch (e: any) { setError(e?.message ?? "Failed to update user status"); }
    });
  }

  const selectClass = "w-full rounded-md border border-brand-primary/30 bg-white px-2 py-2 text-sm outline-none focus:border-brand-primary dark:border-brand-primary/25 dark:bg-[#0a1e2a]";

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="card p-4">
        <h1 className="text-lg font-semibold text-brand-tertiary dark:text-white">User Management</h1>
        <p className="mt-1 text-sm text-brand-neutral">
          Approve pending staff, assign roles, link Salesmen to Managers, and suspend/enable access instantly.
        </p>
        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-brand-primary/25 bg-white dark:bg-brand-tertiary dark:border-brand-primary/20">
        <div className="max-h-[65vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-brand-primary/8 text-left dark:bg-brand-primary/15">
              <tr className="border-b border-brand-primary/20">
                <th className="p-3 text-xs font-semibold uppercase tracking-wide text-brand-secondary dark:text-brand-primary">User</th>
                <th className="p-3 text-xs font-semibold uppercase tracking-wide text-brand-secondary dark:text-brand-primary">Status</th>
                <th className="p-3 text-xs font-semibold uppercase tracking-wide text-brand-secondary dark:text-brand-primary">Role</th>
                <th className="p-3 text-xs font-semibold uppercase tracking-wide text-brand-secondary dark:text-brand-primary">Manager</th>
                <th className="p-3 text-xs font-semibold uppercase tracking-wide text-brand-secondary dark:text-brand-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {props.users.map((u) => {
                const pendingDraft = draftById[u.id];
                const managerName = u.managerId ? managerById.get(u.managerId)?.displayName ?? null : null;

                return (
                  <tr key={u.id} className="border-b border-brand-primary/8 dark:border-brand-primary/10">
                    <td className="p-3 align-top">
                      <div className="font-medium text-brand-tertiary dark:text-white">
                        {u.displayName ?? "Unnamed user"}
                      </div>
                      <div className="mt-1 text-[11px] text-brand-neutral">{u.clerkUserId}</div>
                    </td>

                    <td className="p-3 align-top">
                      <span className={
                        u.status === "Active"
                          ? "rounded-md bg-green-50 px-2 py-1 text-xs text-green-800 dark:bg-green-950/30 dark:text-green-200"
                          : u.status === "Suspended"
                            ? "rounded-md bg-red-50 px-2 py-1 text-xs text-red-800 dark:bg-red-950/30 dark:text-red-200"
                            : "rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
                      }>
                        {u.status}
                      </span>
                    </td>

                    <td className="p-3 align-top">
                      {u.status === "Pending" ? (
                        <select
                          value={pendingDraft?.role ?? "Salesman"}
                          onChange={(e) => setDraft(u.id, {
                            role: e.target.value as Role,
                            managerId: e.target.value === "Salesman"
                              ? (pendingDraft?.managerId ?? props.managers[0]?.id ?? null)
                              : null,
                          })}
                          className={selectClass}
                        >
                          <option value="Admin">Admin</option>
                          <option value="Manager">Manager</option>
                          <option value="Salesman">Salesman</option>
                        </select>
                      ) : (
                        <div className="font-medium text-brand-tertiary dark:text-white">{u.role ?? "-"}</div>
                      )}
                    </td>

                    <td className="p-3 align-top">
                      {u.status === "Pending" ? (
                        pendingDraft?.role === "Salesman" ? (
                          <select
                            value={pendingDraft.managerId ?? ""}
                            onChange={(e) => setDraft(u.id, { managerId: e.target.value || null })}
                            className={selectClass}
                          >
                            {props.managers.length === 0 && <option value="">No managers available</option>}
                            {props.managers.map((m) => (
                              <option key={m.id} value={m.id}>{m.displayName ?? m.clerkUserId}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm text-brand-neutral">-</div>
                        )
                      ) : (
                        <div className="text-sm text-brand-tertiary dark:text-white">{managerName ?? "-"}</div>
                      )}
                    </td>

                    <td className="p-3 align-top">
                      {u.status === "Pending" ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onApprove(u.id)}
                          className="rounded-md bg-brand-primary px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-secondary disabled:opacity-50"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onToggleSuspended(u)}
                          className={
                            "rounded-md border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 " +
                            (u.status === "Suspended"
                              ? "border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700/50 dark:text-green-400 dark:hover:bg-green-950/30"
                              : "border-brand-neutral/30 text-brand-neutral hover:bg-brand-neutral/10")
                          }
                        >
                          {u.status === "Suspended" ? "Enable" : "Suspend"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

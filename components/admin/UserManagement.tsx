"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Role, UserStatus } from "@prisma/client";
import {
  approvePendingUserAction,
  setUserStatusAction,
} from "@/actions/adminUserActions";

type DbUser = {
  id: string;
  authId: string;
  displayName: string | null;
  email: string | null;
  role: Role | null;
  status: UserStatus;
  managerId: string | null;
};

export default function UserManagement(props: {
  users: DbUser[];
  managers: DbUser[];
}) {
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
    const draft: Record<
      string,
      { role: Role; managerId: string | null }
    > = {};

    for (const u of props.users) {
      if (u.status !== "Pending") continue;
      draft[u.id] = { role: "Salesman", managerId: firstManagerId };
    }
    return draft;
  }, [props.users, props.managers]);

  const [draftById, setDraftById] = useState(pendingDefaults);

  function setDraft(userId: string, next: Partial<(typeof draftById)[string]>) {
    setDraftById((prev) => ({
      ...prev,
      [userId]: { ...(prev[userId] ?? pendingDefaults[userId]), ...next },
    }));
  }

  async function onApprove(userId: string) {
    setError(null);
    const draft = draftById[userId];
    if (!draft) {
      setError("No role draft found for this user.");
      return;
    }
    if (draft.role === "Salesman" && !draft.managerId) {
      setError("Manager is required for Salesman approval.");
      return;
    }

    startTransition(async () => {
      try {
        await approvePendingUserAction({
          userId,
          role: draft.role,
          managerId: draft.role === "Salesman" ? draft.managerId : null,
        });
        router.refresh();
      } catch (e: any) {
        setError(e?.message ?? "Failed to approve user");
      }
    });
  }

  async function onToggleSuspended(user: DbUser) {
    setError(null);
    const nextStatus: UserStatus =
      user.status === "Suspended" ? "Active" : "Suspended";

    startTransition(async () => {
      try {
        await setUserStatusAction({ userId: user.id, status: nextStatus });
        router.refresh();
      } catch (e: any) {
        setError(e?.message ?? "Failed to update user status");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h1 className="text-lg font-semibold">User Management</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          Approve pending staff, assign roles, link Salesmen to Managers,
          and suspend/enable access instantly.
        </p>
        {error ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="max-h-[65vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-white text-left dark:bg-neutral-950">
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="p-3 font-semibold">User</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Role</th>
                <th className="p-3 font-semibold">Manager</th>
                <th className="p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {props.users.map((u) => {
                const pendingDraft = draftById[u.id];
                const managerName = u.managerId
                  ? managerById.get(u.managerId)?.displayName ?? null
                  : null;

                return (
                  <tr
                    key={u.id}
                    className="border-b border-neutral-100 dark:border-neutral-900/40"
                  >
                    <td className="p-3 align-top">
                      <div className="font-medium">
                        {u.displayName ?? "Unnamed user"}
                      </div>
                      <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                        {u.email ?? u.authId}
                      </div>
                    </td>

                    <td className="p-3 align-top">
                      <span
                        className={
                          u.status === "Active"
                            ? "rounded-md bg-green-50 px-2 py-1 text-xs text-green-800 dark:bg-green-950/30 dark:text-green-200"
                            : u.status === "Suspended"
                              ? "rounded-md bg-red-50 px-2 py-1 text-xs text-red-800 dark:bg-red-950/30 dark:text-red-200"
                              : "rounded-md bg-yellow-50 px-2 py-1 text-xs text-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-200"
                        }
                      >
                        {u.status}
                      </span>
                    </td>

                    <td className="p-3 align-top">
                      {u.status === "Pending" ? (
                        <select
                          value={pendingDraft?.role ?? "Salesman"}
                          onChange={(e) =>
                            setDraft(u.id, {
                              role: e.target.value as Role,
                              managerId:
                                e.target.value === "Salesman"
                                  ? (pendingDraft?.managerId ??
                                      props.managers[0]?.id ??
                                      null)
                                  : null,
                            })
                          }
                          className="w-full rounded-md border border-neutral-200 bg-white px-2 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-950"
                        >
                          <option value="Admin">Admin</option>
                          <option value="Manager">Manager</option>
                          <option value="Salesman">Salesman</option>
                        </select>
                      ) : (
                        <div className="font-medium">
                          {u.role ?? "-"}
                        </div>
                      )}
                    </td>

                    <td className="p-3 align-top">
                      {u.status === "Pending" ? (
                        pendingDraft?.role === "Salesman" ? (
                          <select
                            value={pendingDraft.managerId ?? ""}
                            onChange={(e) =>
                              setDraft(u.id, {
                                managerId: e.target.value || null,
                              })
                            }
                            className="w-full rounded-md border border-neutral-200 bg-white px-2 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-950"
                          >
                            {props.managers.length === 0 ? (
                              <option value="">No managers available</option>
                            ) : null}
                            {props.managers.map((m) => (
                              <option key={m.id} value={m.id}>
                               {m.displayName ?? m.email ?? m.id}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">
                            -
                          </div>
                        )
                      ) : (
                        <div className="text-sm">
                          {managerName ?? "-"}
                        </div>
                      )}
                    </td>

                    <td className="p-3 align-top">
                      {u.status === "Pending" ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onApprove(u.id)}
                          className="rounded-md bg-neutral-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50 dark:bg-neutral-50 dark:text-neutral-900"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onToggleSuspended(u)}
                          className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-900 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
                        >
                          {u.status === "Suspended"
                            ? "Enable"
                            : "Suspend"}
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



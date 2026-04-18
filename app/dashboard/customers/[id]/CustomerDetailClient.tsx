"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { VisitStatus } from "@prisma/client";
import { updateCustomerAction } from "@/actions/updateCustomer";
import type { SalesmanOption } from "@/actions/getSalesmanList";

type Visit = {
  id: string;
  dateTime: string;
  status: VisitStatus;
  projectName: string;
  salesmanName: string | null;
};

type CustomerDetailClientProps = {
  customer: {
    id: string;
    name: string;
    mobileNumber: string;
    ownerUserId: string;
    ownerName: string | null;
    createdAt: string;
  };
  visits: Visit[];
  salesmanOptions: SalesmanOption[];
  canReassign: boolean;
};

function statusPill(status: VisitStatus) {
  const base = "rounded-md px-2 py-0.5 text-[11px] font-medium";
  switch (status) {
    case "Converted":
      return `${base} bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200`;
    case "Completed":
      return `${base} bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200`;
    case "Cancelled":
      return `${base} bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200`;
    case "Scheduled":
      return `${base} bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200`;
    default:
      return `${base} bg-neutral-50 text-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-200`;
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function CustomerDetailClient({
  customer,
  visits,
  salesmanOptions,
  canReassign,
}: CustomerDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Edit form state
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(customer.name);
  const [mobileNumber, setMobileNumber] = useState(customer.mobileNumber);
  const [newOwnerUserId, setNewOwnerUserId] = useState(customer.ownerUserId);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function resetForm() {
    setName(customer.name);
    setMobileNumber(customer.mobileNumber);
    setNewOwnerUserId(customer.ownerUserId);
    setError(null);
    setSuccess(null);
    setEditing(false);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await updateCustomerAction({
          customerId: customer.id,
          name: name.trim(),
          mobileNumber: mobileNumber.trim(),
          ...(canReassign && newOwnerUserId !== customer.ownerUserId
            ? { newOwnerUserId }
            : {}),
        });
        setSuccess("Customer updated successfully.");
        setEditing(false);
        router.refresh();
      } catch (err: any) {
        setError(err?.message ?? "Failed to update customer");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Customer info card */}
      <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">{customer.name}</h1>
            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              {customer.mobileNumber}
            </p>
            {customer.ownerName && (
              <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                Assigned to {customer.ownerName}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => { setEditing(!editing); setError(null); setSuccess(null); }}
            className="shrink-0 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        <div className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
          Added {formatDate(customer.createdAt)}
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <form onSubmit={handleSave} className="space-y-3">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-200">
              {success}
            </div>
          )}

          <div className="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Customer Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Mobile Number
              </label>
              <input
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
              />
            </div>

            {canReassign && salesmanOptions.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Assigned Salesman
                </label>
                <select
                  value={newOwnerUserId}
                  onChange={(e) => setNewOwnerUserId(e.target.value)}
                  className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600"
                >
                  {salesmanOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName ?? s.id}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 rounded-md border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-md bg-neutral-900 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
            >
              {isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {/* Visit history */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Visit History
            <span className="ml-2 text-xs font-normal text-neutral-400 dark:text-neutral-500">
              ({visits.length})
            </span>
          </h2>
        </div>

        {visits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            No visits recorded for this customer yet.
          </div>
        ) : (
          <div className="space-y-2">
            {visits.map((v) => (
              <div
                key={v.id}
                className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{v.projectName}</div>
                    {v.salesmanName && (
                      <div className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                        {v.salesmanName}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={statusPill(v.status)}>{v.status}</span>
                    <div className="mt-1 text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                      {formatTime(v.dateTime)}
                    </div>
                  </div>
                </div>
                <div className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                  {formatDate(v.dateTime)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
      return `${base} bg-brand-primary/10 text-brand-secondary dark:text-brand-primary`;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function CustomerDetailClient({
  customer, visits, salesmanOptions, canReassign,
}: CustomerDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
    setError(null); setSuccess(null); setEditing(false);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null);
    startTransition(async () => {
      try {
        await updateCustomerAction({
          customerId: customer.id,
          name: name.trim(),
          mobileNumber: mobileNumber.trim(),
          ...(canReassign && newOwnerUserId !== customer.ownerUserId ? { newOwnerUserId } : {}),
        });
        setSuccess("Customer updated successfully.");
        setEditing(false);
        router.refresh();
      } catch (err: any) {
        setError(err?.message ?? "Failed to update customer");
      }
    });
  }

  const labelClass = "mb-1 block text-xs font-medium text-brand-neutral";

  return (
    <div className="space-y-4">
      {/* Customer info card */}
      <div className="card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-brand-tertiary dark:text-white">{customer.name}</h1>
            <p className="mt-0.5 text-sm text-brand-neutral">{customer.mobileNumber}</p>
            {customer.ownerName && (
              <p className="mt-0.5 text-xs text-brand-neutral">
                Assigned to {customer.ownerName}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => { setEditing(!editing); setError(null); setSuccess(null); }}
            className="btn-outline shrink-0 text-xs py-1.5"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
        <div className="mt-2 text-xs text-brand-neutral">Added {formatDate(customer.createdAt)}</div>
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

          <div className="space-y-3 card p-4">
            <div>
              <label className={labelClass}>Customer Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
            </div>
            <div>
              <label className={labelClass}>Mobile Number</label>
              <input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required className="input" />
            </div>
            {canReassign && salesmanOptions.length > 0 && (
              <div>
                <label className={labelClass}>Assigned Salesman</label>
                <select
                  value={newOwnerUserId}
                  onChange={(e) => setNewOwnerUserId(e.target.value)}
                  className="input"
                >
                  {salesmanOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.displayName ?? s.id}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={resetForm} className="btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="btn-primary flex-1 py-2.5">
              {isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {/* Visit history */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-brand-tertiary dark:text-white">
            Visit History
            <span className="ml-2 text-xs font-normal text-brand-neutral">({visits.length})</span>
          </h2>
        </div>

        {visits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand-primary/30 p-6 text-center text-sm text-brand-neutral">
            No visits recorded for this customer yet.
          </div>
        ) : (
          <div className="space-y-2">
            {visits.map((v) => (
              <div key={v.id} className="card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-brand-tertiary dark:text-white">
                      {v.projectName}
                    </div>
                    {v.salesmanName && (
                      <div className="mt-0.5 text-xs text-brand-neutral">{v.salesmanName}</div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={statusPill(v.status)}>{v.status}</span>
                    <div className="mt-1 text-xs tabular-nums text-brand-neutral">{formatTime(v.dateTime)}</div>
                  </div>
                </div>
                <div className="mt-1.5 text-xs text-brand-neutral">{formatDate(v.dateTime)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

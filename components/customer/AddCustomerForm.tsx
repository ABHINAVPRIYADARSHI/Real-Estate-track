"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";
import { addCustomerAction } from "@/actions/addCustomer";
import Spinner from "@/components/ui/Spinner";

type SalesmanOption = { id: string; displayName: string | null };

type Props = {
  role: Role;
  salesmen: SalesmanOption[]; // empty for Salesman role
};

export default function AddCustomerForm({ role, salesmen }: Props) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isSalesman = role === "Salesman";
  const needsAssignment = !isSalesman; // Admin or Manager must pick a salesman

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (needsAssignment && !ownerUserId) {
      setError("Please select a salesman to assign this customer to.");
      return;
    }

    startTransition(async () => {
      try {
        await addCustomerAction({
          name: name.trim(),
          mobileNumber: mobileNumber.trim(),
          ownerUserId: needsAssignment ? ownerUserId : undefined,
        });
        setName("");
        setMobileNumber("");
        setOwnerUserId("");
        setSuccess("Customer added successfully.");
        router.refresh();
      } catch (err: any) {
        setError(err?.message ?? "Failed to add customer");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Header */}
      <div className="card p-4">
        <h1 className="text-lg font-semibold text-brand-tertiary dark:text-white">
          Add Customer
        </h1>
        <p className="mt-1 text-sm text-brand-neutral">
          Add a new lead with name, mobile number
          {needsAssignment ? ", and the assigned salesman." : "."}
        </p>
      </div>

      {/* Error / Success banners */}
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

      {/* Customer Name */}
      <div className="card space-y-2 p-4">
        <label className="text-sm font-medium text-brand-tertiary dark:text-white">
          Customer Name
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rahul Sharma"
          className="input"
          disabled={busy}
        />
      </div>

      {/* Mobile Number */}
      <div className="card space-y-2 p-4">
        <label className="text-sm font-medium text-brand-tertiary dark:text-white">
          Mobile Number
        </label>
        <input
          required
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          placeholder="e.g. 9876543210"
          className="input"
          disabled={busy}
        />
        {isSalesman && (
          <p className="text-xs text-brand-neutral">
            This customer will be assigned to you.
          </p>
        )}
      </div>

      {/* Salesman selector — only for Admin / Manager */}
      {needsAssignment && (
        <div className="card space-y-2 p-4">
          <label className="text-sm font-medium text-brand-tertiary dark:text-white">
            Assign to Salesman
            <span className="ml-1 text-red-500">*</span>
          </label>

          {salesmen.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300">
              {role === "Manager"
                ? "No active salesmen found in your team. Ask the Admin to activate one first."
                : "No active salesmen found. Activate a salesman from User Management first."}
            </div>
          ) : (
            <>
              <select
                required
                value={ownerUserId}
                onChange={(e) => setOwnerUserId(e.target.value)}
                className="input"
                disabled={busy}
              >
                <option value="">— Select salesman —</option>
                {salesmen.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName ?? s.id}
                  </option>
                ))}
              </select>
              <p className="text-xs text-brand-neutral">
                {role === "Manager"
                  ? "Select one of your team members."
                  : "Select any active salesman."}
              </p>
            </>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={busy || (needsAssignment && salesmen.length === 0)}
        className="btn-primary flex w-full items-center justify-center gap-2"
      >
        {busy && <Spinner size="sm" />}
        {busy ? "Saving…" : "Add Customer"}
      </button>
    </form>
  );
}

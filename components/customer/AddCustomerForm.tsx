"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";
import { addCustomerAction } from "@/actions/addCustomer";

export default function AddCustomerForm({ role }: { role: Role }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const ownerHint =
    role === "Salesman"
      ? "Customer will be assigned to you."
      : role === "Manager"
        ? "Customer will be auto-assigned to an active salesman in your team."
        : "Customer will be auto-assigned to an active salesman.";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await addCustomerAction({
          name: name.trim(),
          mobileNumber: mobileNumber.trim(),
        });
        setName("");
        setMobileNumber("");
        setSuccess("Customer added successfully.");
        router.refresh();
      } catch (err: any) {
        setError(err?.message ?? "Failed to add customer");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h1 className="text-lg font-semibold">Add Customer</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          Add a new lead with just name and mobile number.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-200">
          {success}
        </div>
      ) : null}

      <div className="space-y-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <label className="text-sm font-medium">Customer Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rahul Sharma"
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950"
        />
      </div>

      <div className="space-y-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <label className="text-sm font-medium">Mobile Number</label>
        <input
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          placeholder="e.g. 9876543210"
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950"
        />
        <div className="text-xs text-neutral-600 dark:text-neutral-300">
          {ownerHint}
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-neutral-900 px-3 py-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-50 dark:text-neutral-900"
      >
        {busy ? "Saving..." : "Add Customer"}
      </button>
    </form>
  );
}

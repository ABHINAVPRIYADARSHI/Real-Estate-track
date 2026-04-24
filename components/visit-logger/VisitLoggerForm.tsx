"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Role, UserStatus, VisitStatus } from "@prisma/client";
import { addVisitAction } from "@/actions/addVisit";
import { searchCustomersAction } from "@/actions/searchCustomers";
import Snackbar from "@/components/ui/Snackbar";

type CustomerSearchResult = {
  id: string;
  name: string;
  mobileNumber: string;
  ownerName: string | null;
};

export default function VisitLoggerForm(props: {
  role: Role;
  salesmen: Array<{ id: string; displayName: string | null; status: UserStatus }>;
  customers: Array<{ id: string; name: string; mobileNumber: string }>;
  projects: Array<{ id: string; name: string; location: string }>;
  initialStatus?: VisitStatus;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CustomerSearchResult[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  const selectedCustomer = useMemo(
    () => results.find((r) => r.id === selectedCustomerId) ?? null,
    [results, selectedCustomerId]
  );

  const [projectName, setProjectName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [dateTimeLocal, setDateTimeLocal] = useState(() => {
    // Default to "now" rounded to next 5 minutes for field usability.
    const d = new Date();
    d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5);
    d.setSeconds(0, 0);

    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());

    // datetime-local expects local time: YYYY-MM-DDTHH:mm
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  });
  const [status, setStatus] = useState<VisitStatus>(
    props.initialStatus ?? "Scheduled"
  );

  const [assignedSalesmanId, setAssignedSalesmanId] = useState(
    props.salesmen[0]?.id ?? ""
  );

  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  async function onSearch() {
    setError(null);
    setSearching(true);
    try {
      const res = await searchCustomersAction({ query });
      setResults(res);
    } catch (e: any) {
      setResults([]);
      setError(e?.message ?? "Customer search failed");
    } finally {
      setSearching(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedCustomerId) {
      setError("Please select a customer.");
      return;
    }
    if (!projectName.trim()) {
      setError("Project is required.");
      return;
    }

    // datetime-local gives local time without timezone; server parses Date().
    // If the string is empty, it will be rejected by validation.
    startTransition(async () => {
      try {
        await addVisitAction({
          customerId: selectedCustomerId,
          projectName: projectName.trim(),
          dateTime: new Date(dateTimeLocal).toISOString(),
          status,
          assignedSalesmanId:
            props.role === "Salesman" ? undefined : assignedSalesmanId,
        });

        setSnackbar("Visit scheduled successfully!");
        // Redirect after snackbar is visible briefly.
        setTimeout(() => router.push("/dashboard/visits"), 1200);
      } catch (e: any) {
        setError(e?.message ?? "Failed to schedule visit");
      }
    });
  }

  const canDelegate = props.role === "Manager" || props.role === "Admin";

  return (
    <>
      {snackbar && (
        <Snackbar message={snackbar} onClose={() => setSnackbar(null)} />
      )}
      <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h1 className="text-lg font-semibold">Visit Logger</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          Log or schedule a visit.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="space-y-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Customer</label>
          <select
            value={selectedCustomerId}
            onChange={(ev) => setSelectedCustomerId(ev.target.value)}
            className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950"
          >
            <option value="">-- Choose a customer --</option>
            {props.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.mobileNumber})
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-neutral-200 dark:border-neutral-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-neutral-500 dark:bg-neutral-950">Or Search</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Search by Mobile/Name</label>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(ev) => setQuery(ev.target.value)}
              placeholder="e.g. 5551234 or John"
              className="flex-1 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950"
            />
            <button
              type="button"
              disabled={searching || query.trim().length === 0}
              onClick={onSearch}
              className="btn-primary px-3 py-2 text-xs disabled:opacity-50"
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </div>

          {results.length > 0 ? (
            <div className="max-h-44 overflow-auto rounded-md border border-neutral-200 dark:border-neutral-800">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setSelectedCustomerId(r.id);
                  }}
                  className={
                    "w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900/50 " +
                    (selectedCustomerId === r.id
                      ? "bg-neutral-100 dark:bg-neutral-900/70"
                      : "")
                  }
                >
                  <div className="font-medium">{r.name}</div>
                  <div className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-300">
                    {r.mobileNumber}
                    {r.ownerName ? ` • Owner: ${r.ownerName}` : ""}
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {selectedCustomer ? (
          <div className="text-xs text-neutral-600 dark:text-neutral-300">
            Selected: <span className="font-medium">{selectedCustomer.name}</span>{" "}
            ({selectedCustomer.mobileNumber})
          </div>
        ) : selectedCustomerId ? (
          <div className="text-xs text-neutral-600 dark:text-neutral-300">
            Selected customer.
          </div>
        ) : (
          <div className="text-xs text-neutral-600 dark:text-neutral-300">
            Select a customer above or search to enable logging.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <label className="text-sm font-medium">Project</label>
          {props.projects.length > 0 ? (
            <select
              value={selectedProjectId}
              onChange={(ev) => {
                const pid = ev.target.value;
                setSelectedProjectId(pid);
                if (pid === "__custom__") {
                  setProjectName("");
                } else {
                  const proj = props.projects.find((p) => p.id === pid);
                  setProjectName(proj?.name ?? "");
                }
              }}
              className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950"
            >
              <option value="">-- Select a project --</option>
              {props.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.location ? ` · ${p.location}` : ""}
                </option>
              ))}
              <option value="__custom__">Other / type manually…</option>
            </select>
          ) : null}
          {(selectedProjectId === "__custom__" || props.projects.length === 0) && (
            <input
              value={projectName}
              onChange={(ev) => setProjectName(ev.target.value)}
              placeholder="e.g. Lake View Apartments"
              className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950"
            />
          )}
        </div>

        <div className="space-y-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <label className="text-sm font-medium">Date/Time</label>
          <input
            type="datetime-local"
            value={dateTimeLocal}
            onChange={(ev) => setDateTimeLocal(ev.target.value)}
            className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950"
          />
        </div>

        <div className="space-y-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <label className="text-sm font-medium">Visit Status</label>
          <select
            value={status}
            onChange={(ev) => setStatus(ev.target.value as VisitStatus)}
            className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950"
          >
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Converted">Converted</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {canDelegate ? (
          <div className="space-y-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <label className="text-sm font-medium">Assign to Salesman</label>
            <select
              value={assignedSalesmanId}
              onChange={(ev) => setAssignedSalesmanId(ev.target.value)}
              className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950"
            >
              {props.salesmen.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName ?? s.id}
                </option>
              ))}
            </select>
            <div className="text-xs text-neutral-600 dark:text-neutral-300">
              The assigned salesman will see customer details for this visit.
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="btn-primary flex-1 py-3 text-sm disabled:opacity-50"
        >
          {busy ? "Saving..." : "Schedule Visit"}
        </button>
      </div>
    </form>
    </>
  );
}


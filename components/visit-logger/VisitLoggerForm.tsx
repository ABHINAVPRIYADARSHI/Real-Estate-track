"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Role, UserStatus, VisitStatus } from "@prisma/client";
import { addVisitAction } from "@/actions/addVisit";
import { searchCustomersAction } from "@/actions/searchCustomers";
import type { ProjectOption } from "@/actions/getProjects";

type CustomerSearchResult = {
  id: string;
  name: string;
  mobileNumber: string;
  ownerName: string | null;
};

export default function VisitLoggerForm(props: {
  role: Role;
  salesmen: Array<{ id: string; displayName: string | null; status: UserStatus }>;
  projects: ProjectOption[];
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

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [dateTimeLocal, setDateTimeLocal] = useState(() => {
    const d = new Date();
    d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5);
    d.setSeconds(0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [status, setStatus] = useState<VisitStatus>(
    props.initialStatus ?? "Scheduled"
  );
  const [assignedSalesmanId, setAssignedSalesmanId] = useState(
    props.salesmen[0]?.id ?? ""
  );
  const [error, setError] = useState<string | null>(null);

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

  const selectedProject = props.projects.find((p) => p.id === selectedProjectId) ?? null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedCustomerId) {
      setError("Select a customer from the search results.");
      return;
    }
    if (!selectedProjectId) {
      setError("Please select a project.");
      return;
    }

    startTransition(async () => {
      try {
        await addVisitAction({
          customerId: selectedCustomerId,
          projectId: selectedProjectId,
          dateTime: new Date(dateTimeLocal).toISOString(),
          status,
          assignedSalesmanId:
            props.role === "Salesman" ? undefined : assignedSalesmanId,
        });
        router.refresh();

        // Keep customer selection for fast consecutive logging.
        setSelectedProjectId("");
        setStatus("Scheduled");
      } catch (e: any) {
        setError(e?.message ?? "Failed to log visit");
      }
    });
  }

  const canDelegate = props.role === "Manager" || props.role === "Admin";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h1 className="text-lg font-semibold">Visit Logger</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          Log or schedule a visit. Delegation is available for Managers/Admins.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {/* Customer search */}
      <div className="space-y-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <label className="text-sm font-medium">Customer (Search by Mobile/Name)</label>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(ev) => setQuery(ev.target.value)}
            onKeyDown={(ev) => { if (ev.key === "Enter") { ev.preventDefault(); onSearch(); } }}
            placeholder="e.g. 5551234 or John"
            className="flex-1 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950"
          />
          <button
            type="button"
            disabled={searching || query.trim().length === 0}
            onClick={onSearch}
            className="rounded-md bg-neutral-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50 dark:bg-neutral-50 dark:text-neutral-900"
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
                onClick={() => setSelectedCustomerId(r.id)}
                className={
                  "w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900/50 " +
                  (selectedCustomerId === r.id ? "bg-neutral-100 dark:bg-neutral-900/70" : "")
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

        {selectedCustomer ? (
          <div className="text-xs text-neutral-600 dark:text-neutral-300">
            Selected: <span className="font-medium">{selectedCustomer.name}</span>{" "}
            ({selectedCustomer.mobileNumber})
          </div>
        ) : selectedCustomerId ? (
          <div className="text-xs text-neutral-600 dark:text-neutral-300">Selected customer.</div>
        ) : (
          <div className="text-xs text-neutral-600 dark:text-neutral-300">
            Select a result to enable logging.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Project selector */}
        <div className="space-y-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <label className="text-sm font-medium">
            Project <span className="text-red-500">*</span>
          </label>
          {props.projects.length === 0 ? (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              No active projects available. Ask an Admin to add projects first.
            </p>
          ) : (
            <select
              value={selectedProjectId}
              onChange={(ev) => setSelectedProjectId(ev.target.value)}
              className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950"
            >
              <option value="">— Select a project —</option>
              {props.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Project detail card */}
          {selectedProject && (
            <div className="rounded-md bg-neutral-50 px-3 py-2 text-xs text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400 space-y-0.5">
              <div className="flex items-center gap-1">
                <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                {selectedProject.location}
              </div>
              {selectedProject.price && (
                <div className="flex items-center gap-1">
                  <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  {selectedProject.price}
                </div>
              )}
              {selectedProject.description && (
                <p className="pt-0.5 leading-relaxed">{selectedProject.description}</p>
              )}
            </div>
          )}
        </div>

        {/* Date / time */}
        <div className="space-y-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <label className="text-sm font-medium">Date/Time</label>
          <input
            type="datetime-local"
            value={dateTimeLocal}
            onChange={(ev) => setDateTimeLocal(ev.target.value)}
            className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950"
          />
        </div>

        {/* Visit status */}
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

        {/* Salesman delegation (Manager/Admin) */}
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
          className="flex-1 rounded-md bg-neutral-900 px-3 py-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-50 dark:text-neutral-900"
        >
          {busy ? "Saving..." : "Log Visit"}
        </button>
      </div>
    </form>
  );
}

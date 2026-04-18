"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCustomersAction, type GetCustomersResult } from "@/actions/getCustomers";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function CustomersClient({
  initialData,
  initialQuery,
  initialPage,
}: {
  initialData: GetCustomersResult;
  initialQuery: string;
  initialPage: number;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState<GetCustomersResult>(initialData);
  const [isPending, startTransition] = useTransition();
  const debouncedQuery = useDebounce(query, 350);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    startTransition(async () => {
      try {
        const result = await getCustomersAction({ query: debouncedQuery, page });
        setData(result);
      } catch { /* keep stale data */ }
    });
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (page > 1) params.set("page", String(page));
    router.replace(`/dashboard/customers${params.size ? "?" + params.toString() : ""}`, { scroll: false });
  }, [debouncedQuery, page]);

  function handleSearch(value: string) {
    setQuery(value);
    setPage(1);
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-neutral"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          placeholder="Search by name or mobile…"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-xl border border-brand-primary/30 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 dark:bg-[#0a1e2a] dark:border-brand-primary/25"
        />
        {isPending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-primary/30 border-t-brand-primary" />
          </div>
        )}
      </div>

      {/* Results summary */}
      <div className="text-xs text-brand-neutral">
        {data.totalCount === 0
          ? "No customers found"
          : `${data.totalCount} customer${data.totalCount === 1 ? "" : "s"} found`}
        {data.totalPages > 1 && ` — page ${data.page} of ${data.totalPages}`}
      </div>

      {/* Customer list */}
      {data.customers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-primary/30 p-8 text-center">
          <svg
            className="mx-auto mb-3 h-10 w-10 text-brand-primary/30"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          <div className="text-sm text-brand-neutral">
            {query ? "No customers match your search" : "No customers yet"}
          </div>
          {!query && (
            <Link
              href="/dashboard/add-customer"
              className="mt-3 inline-block rounded-md border border-brand-primary/40 px-3 py-1.5 text-sm font-medium text-brand-primary hover:bg-brand-primary/10 transition-colors"
            >
              Add first customer
            </Link>
          )}
        </div>
      ) : (
        <div className="divide-y divide-brand-primary/10 rounded-xl border border-brand-primary/25 bg-white dark:bg-brand-tertiary dark:divide-brand-primary/15">
          {data.customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/dashboard/customers/${customer.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-brand-primary/8 first:rounded-t-xl last:rounded-b-xl"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-brand-tertiary dark:text-white">
                  {customer.name}
                </div>
                <div className="mt-0.5 text-xs text-brand-neutral">
                  {customer.mobileNumber}
                  {customer.ownerName ? ` · ${customer.ownerName}` : ""}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {customer._count.visits > 0 && (
                  <span className="rounded-full bg-brand-primary/15 px-2 py-0.5 text-[11px] font-medium text-brand-secondary dark:text-brand-primary">
                    {customer._count.visits} visit{customer._count.visits === 1 ? "" : "s"}
                  </span>
                )}
                <svg className="h-4 w-4 text-brand-neutral" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isPending}
            className="flex items-center gap-1.5 rounded-lg border border-brand-primary/30 px-3 py-1.5 text-sm font-medium text-brand-tertiary transition-colors hover:bg-brand-primary/10 disabled:opacity-40 dark:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Previous
          </button>

          <div className="flex items-center gap-1 text-xs text-brand-neutral">
            {Array.from({ length: data.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === data.totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && (arr[idx - 1] as number) + 1 < p) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "…" ? (
                  <span key={`ellipsis-${idx}`} className="px-1">…</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item as number)}
                    className={
                      "h-7 min-w-[28px] rounded-md px-1.5 text-xs font-medium transition-colors " +
                      (page === item
                        ? "bg-brand-primary text-white"
                        : "hover:bg-brand-primary/10 text-brand-tertiary dark:text-white")
                    }
                  >
                    {item}
                  </button>
                )
              )}
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages || isPending}
            className="flex items-center gap-1.5 rounded-lg border border-brand-primary/30 px-3 py-1.5 text-sm font-medium text-brand-tertiary transition-colors hover:bg-brand-primary/10 disabled:opacity-40 dark:text-white"
          >
            Next
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

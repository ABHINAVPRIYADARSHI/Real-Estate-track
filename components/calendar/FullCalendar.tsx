"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { VisitStatus } from "@prisma/client";
import { getVisitsByMonthAction } from "@/actions/getVisitsByMonth";

/* ─── types ─── */
type VisitRow = {
  id: string;
  dateTime: string;
  status: VisitStatus;
  projectName: string;
  customer: { id: string; name: string; mobileNumber: string };
};

/* ─── helpers ─── */
function pad(n: number) {
  return String(n).padStart(2, "0");
}

function localKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function timeLabel(d: Date) {
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function statusColor(s: VisitStatus) {
  switch (s) {
    case "Converted":
      return "bg-green-500 dark:bg-green-400";
    case "Completed":
      return "bg-emerald-500 dark:bg-emerald-400";
    case "Cancelled":
      return "bg-red-500 dark:bg-red-400";
    case "Scheduled":
      return "bg-blue-500 dark:bg-blue-400";
    default:
      return "bg-neutral-400";
  }
}

function statusPill(status: VisitStatus) {
  if (status === "Converted")
    return "rounded-md bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-800 dark:bg-green-950/30 dark:text-green-200";
  if (status === "Completed")
    return "rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200";
  if (status === "Cancelled")
    return "rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-800 dark:bg-red-950/30 dark:text-red-200";
  if (status === "Scheduled")
    return "rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800 dark:bg-blue-950/30 dark:text-blue-200";
  return "rounded-md bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-200";
}

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/* ─── component ─── */
export default function FullCalendar(props: {
  initialVisits: VisitRow[];
  initialYear: number;
  initialMonth: number;
}) {
  const [year, setYear] = useState(props.initialYear);
  const [month, setMonth] = useState(props.initialMonth);
  const [visits, setVisits] = useState<VisitRow[]>(props.initialVisits);
  const [loading, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(props.initialYear);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayKey = localKey(today);

  /* ─── fetch visits when month changes ─── */
  const fetchMonth = useCallback(
    (y: number, m: number) => {
      startTransition(async () => {
        try {
          const data = await getVisitsByMonthAction({ year: y, month: m });
          setVisits(data);
        } catch {
          setVisits([]);
        }
      });
    },
    []
  );

  // Skip fetch for the initial month (we already have data)
  const isInitial =
    year === props.initialYear && month === props.initialMonth;

  useEffect(() => {
    if (!isInitial) fetchMonth(year, month);
  }, [year, month, isInitial, fetchMonth]);

  /* ─── group visits by day ─── */
  const visitsByDay = useMemo(() => {
    const map: Record<string, VisitRow[]> = {};
    for (const v of visits) {
      const key = localKey(new Date(v.dateTime));
      if (!map[key]) map[key] = [];
      map[key].push(v);
    }
    return map;
  }, [visits]);

  /* ─── calendar grid ─── */
  const { cells, weeksCount } = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const startDow = firstOfMonth.getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    const cells: Array<{
      date: Date;
      key: string;
      day: number;
      inMonth: boolean;
    }> = [];

    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      cells.push({ date: d, key: localKey(d), day: d.getDate(), inMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      cells.push({ date: dt, key: localKey(dt), day: d, inMonth: true });
    }

    // Pad to fill last week
    const remainder = cells.length % 7;
    if (remainder > 0) {
      for (let d = 1; d <= 7 - remainder; d++) {
        const dt = new Date(year, month + 1, d);
        cells.push({ date: dt, key: localKey(dt), day: d, inMonth: false });
      }
    }

    return { cells, weeksCount: cells.length / 7 };
  }, [year, month]);

  /* ─── selected day ─── */
  const [selectedKey, setSelectedKey] = useState(todayKey);

  const selectedDayVisits = useMemo(() => {
    return (visitsByDay[selectedKey] ?? []).sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );
  }, [visitsByDay, selectedKey]);

  const selectedDate = useMemo(() => {
    const cell = cells.find((c) => c.key === selectedKey);
    return cell?.date ?? today;
  }, [cells, selectedKey, today]);

  /* ─── navigation ─── */
  function goPrev() {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  }

  function goNext() {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  }

  function goToday() {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedKey(todayKey);
    setPickerOpen(false);
  }

  function openPicker() {
    setPickerYear(year);
    setPickerOpen(true);
  }

  function selectPickerMonth(m: number) {
    setYear(pickerYear);
    setMonth(m);
    setPickerOpen(false);
  }

  return (
    <div className="space-y-3">
      {/* ── Month header ── */}
      <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous month"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          {/* Tappable month/year — opens picker */}
          <button
            type="button"
            onClick={openPicker}
            className="group flex items-center gap-1.5 rounded-lg px-3 py-1 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <span className="text-base font-semibold">
              {MONTH_NAMES[month]} {year}
            </span>
            <svg
              className="h-3.5 w-3.5 text-neutral-400 transition-transform group-hover:text-neutral-600 dark:group-hover:text-neutral-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={goNext}
            aria-label="Next month"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="mt-1 text-center text-[11px] text-neutral-500 dark:text-neutral-400 animate-pulse">
            Loading…
          </div>
        )}

        {/* Today button */}
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={goToday}
            className="rounded-md border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Today
          </button>
        </div>
      </div>

      {/* ── Month/Year Picker Overlay ── */}
      {pickerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm dark:bg-black/40"
            onClick={() => setPickerOpen(false)}
          />

          {/* Picker panel */}
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg animate-[slideUp_0.25s_ease-out] rounded-t-2xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
            {/* Year selector */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPickerYear(pickerYear - 1)}
                aria-label="Previous year"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              <span className="text-lg font-bold tabular-nums">{pickerYear}</span>

              <button
                type="button"
                onClick={() => setPickerYear(pickerYear + 1)}
                aria-label="Next year"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* Month grid */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {MONTH_SHORT.map((mName, mIdx) => {
                const isCurrent = pickerYear === year && mIdx === month;
                const isNow =
                  pickerYear === today.getFullYear() && mIdx === today.getMonth();

                return (
                  <button
                    key={mIdx}
                    type="button"
                    onClick={() => selectPickerMonth(mIdx)}
                    className={
                      "rounded-lg py-2.5 text-sm font-medium transition-colors " +
                      (isCurrent
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 "
                        : isNow
                          ? "border border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100 "
                          : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 ")
                    }
                  >
                    {mName}
                  </button>
                );
              })}
            </div>

            {/* Quick actions */}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={goToday}
                className="flex-1 rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Go to Today
              </button>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="flex-1 rounded-lg border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Calendar grid ── */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50">
          {DAY_HEADERS.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const dayVisits = visitsByDay[cell.key];
            const count = dayVisits?.length ?? 0;
            const isToday = cell.key === todayKey;
            const isSelected = cell.key === selectedKey;

            // Unique statuses for dot indicators
            const statuses: VisitStatus[] = [];
            if (dayVisits) {
              const seen = new Set<VisitStatus>();
              for (const v of dayVisits) {
                if (!seen.has(v.status)) {
                  seen.add(v.status);
                  statuses.push(v.status);
                }
              }
            }

            return (
              <button
                key={`${cell.key}-${idx}`}
                type="button"
                onClick={() => setSelectedKey(cell.key)}
                className={
                  "relative flex flex-col items-center justify-start py-2 min-h-[52px] border-b border-r border-neutral-100 transition-colors dark:border-neutral-800/60 " +
                  (!cell.inMonth
                    ? "text-neutral-300 dark:text-neutral-700 "
                    : "text-neutral-900 dark:text-neutral-100 ") +
                  (isSelected
                    ? "bg-neutral-900/5 dark:bg-neutral-50/5 "
                    : "hover:bg-neutral-50 dark:hover:bg-neutral-800/40 ") +
                  // Remove right border on last column
                  ((idx + 1) % 7 === 0 ? "border-r-0 " : "") +
                  // Remove bottom border on last row
                  (idx >= cells.length - 7 ? "border-b-0 " : "")
                }
              >
                <span
                  className={
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium " +
                    (isToday
                      ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 "
                      : isSelected && cell.inMonth
                        ? "font-bold "
                        : "")
                  }
                >
                  {cell.day}
                </span>

                {/* Visit indicator dots */}
                {count > 0 && (
                  <div className="mt-0.5 flex items-center gap-0.5">
                    {statuses.slice(0, 3).map((s, i) => (
                      <span
                        key={i}
                        className={`inline-block h-1.5 w-1.5 rounded-full ${statusColor(s)}`}
                      />
                    ))}
                    {count > 3 && (
                      <span className="text-[9px] font-medium text-neutral-500 dark:text-neutral-400 ml-0.5">
                        +{count - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected day detail ── */}
      <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {selectedDate.toLocaleDateString(undefined, { weekday: "long" })}
            </div>
            <div className="mt-0.5 text-base font-semibold">
              {selectedDate.toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            {selectedDayVisits.length}{" "}
            {selectedDayVisits.length === 1 ? "visit" : "visits"}
          </div>
        </div>
      </div>

      {/* ── Visit cards ── */}
      <div className="space-y-2">
        {selectedDayVisits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 p-4 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <svg className="mx-auto mb-2 h-8 w-8 text-neutral-300 dark:text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            No visits on this day
          </div>
        ) : (
          selectedDayVisits.map((v) => {
            const d = new Date(v.dateTime);
            return (
              <div
                key={v.id}
                className="rounded-xl border border-neutral-200 p-3 transition-colors hover:bg-neutral-50/50 dark:border-neutral-800 dark:hover:bg-neutral-900/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {v.customer.name}
                    </div>
                    <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                      {v.projectName}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs font-medium tabular-nums">
                      {timeLabel(d)}
                    </div>
                    <div className="mt-1">
                      <span className={statusPill(v.status)}>{v.status}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <a
                    href={`tel:${v.customer.mobileNumber}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {v.customer.mobileNumber}
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

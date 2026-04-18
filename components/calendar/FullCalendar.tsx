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
function pad(n: number) { return String(n).padStart(2, "0"); }
function localKey(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function timeLabel(d: Date) { return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }); }

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_HEADERS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/* Status dot color — kept semantic, not brand */
function statusColor(s: VisitStatus) {
  switch (s) {
    case "Converted": return "bg-green-500 dark:bg-green-400";
    case "Completed": return "bg-emerald-500 dark:bg-emerald-400";
    case "Cancelled":  return "bg-red-500 dark:bg-red-400";
    case "Scheduled":  return "bg-blue-500 dark:bg-blue-400";
    default:           return "bg-brand-neutral";
  }
}

function statusPill(status: VisitStatus) {
  const base = "rounded-md px-2 py-0.5 text-[11px] font-medium";
  if (status === "Converted") return `${base} bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200`;
  if (status === "Completed") return `${base} bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200`;
  if (status === "Cancelled")  return `${base} bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200`;
  if (status === "Scheduled")  return `${base} bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200`;
  return `${base} bg-brand-primary/10 text-brand-secondary dark:text-brand-primary`;
}

/* ─── component ─── */
export default function FullCalendar(props: {
  initialVisits: VisitRow[];
  initialYear: number;
  initialMonth: number;
}) {
  const [year, setYear]     = useState(props.initialYear);
  const [month, setMonth]   = useState(props.initialMonth);
  const [visits, setVisits] = useState<VisitRow[]>(props.initialVisits);
  const [loading, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(props.initialYear);

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const todayKey = localKey(today);

  const fetchMonth = useCallback((y: number, m: number) => {
    startTransition(async () => {
      try { setVisits(await getVisitsByMonthAction({ year: y, month: m })); }
      catch { setVisits([]); }
    });
  }, []);

  const isInitial = year === props.initialYear && month === props.initialMonth;
  useEffect(() => { if (!isInitial) fetchMonth(year, month); }, [year, month, isInitial, fetchMonth]);

  const visitsByDay = useMemo(() => {
    const map: Record<string, VisitRow[]> = {};
    for (const v of visits) {
      const key = localKey(new Date(v.dateTime));
      if (!map[key]) map[key] = [];
      map[key].push(v);
    }
    return map;
  }, [visits]);

  const { cells } = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const startDow = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const cells: Array<{ date: Date; key: string; day: number; inMonth: boolean }> = [];

    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      cells.push({ date: d, key: localKey(d), day: d.getDate(), inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      cells.push({ date: dt, key: localKey(dt), day: d, inMonth: true });
    }
    const remainder = cells.length % 7;
    if (remainder > 0) {
      for (let d = 1; d <= 7 - remainder; d++) {
        const dt = new Date(year, month + 1, d);
        cells.push({ date: dt, key: localKey(dt), day: d, inMonth: false });
      }
    }
    return { cells, weeksCount: cells.length / 7 };
  }, [year, month]);

  const [selectedKey, setSelectedKey] = useState(todayKey);

  const selectedDayVisits = useMemo(() =>
    (visitsByDay[selectedKey] ?? []).sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    ), [visitsByDay, selectedKey]);

  const selectedDate = useMemo(() => {
    const cell = cells.find((c) => c.key === selectedKey);
    return cell?.date ?? today;
  }, [cells, selectedKey, today]);

  function goPrev() { month === 0 ? (setYear(year - 1), setMonth(11)) : setMonth(month - 1); }
  function goNext() { month === 11 ? (setYear(year + 1), setMonth(0)) : setMonth(month + 1); }
  function goToday() { const n = new Date(); setYear(n.getFullYear()); setMonth(n.getMonth()); setSelectedKey(todayKey); setPickerOpen(false); }
  function openPicker() { setPickerYear(year); setPickerOpen(true); }
  function selectPickerMonth(m: number) { setYear(pickerYear); setMonth(m); setPickerOpen(false); }

  const navBtnClass = "inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-neutral transition-colors hover:bg-brand-primary/10 hover:text-brand-primary";

  return (
    <div className="space-y-3">
      {/* ── Month header ── */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <button type="button" onClick={goPrev} aria-label="Previous month" className={navBtnClass}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={openPicker}
            className="group flex items-center gap-1.5 rounded-lg px-3 py-1 transition-colors hover:bg-brand-primary/10"
          >
            <span className="text-base font-semibold text-brand-tertiary dark:text-white">
              {MONTH_NAMES[month]} {year}
            </span>
            <svg className="h-3.5 w-3.5 text-brand-neutral transition-transform group-hover:text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <button type="button" onClick={goNext} aria-label="Next month" className={navBtnClass}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        {loading && (
          <div className="mt-1 text-center text-[11px] text-brand-neutral animate-pulse">Loading…</div>
        )}

        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={goToday}
            className="rounded-md border border-brand-primary/30 px-3 py-1 text-xs font-medium text-brand-primary transition-colors hover:bg-brand-primary/10"
          >
            Today
          </button>
        </div>
      </div>

      {/* ── Month/Year Picker Overlay ── */}
      {pickerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-brand-tertiary/40 backdrop-blur-sm"
            onClick={() => setPickerOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg animate-[slideUp_0.25s_ease-out] rounded-t-2xl border border-brand-primary/25 bg-white p-5 shadow-xl dark:bg-brand-tertiary sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
            {/* Year selector */}
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setPickerYear(pickerYear - 1)} aria-label="Previous year" className={navBtnClass}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <span className="text-lg font-bold tabular-nums text-brand-tertiary dark:text-white">{pickerYear}</span>
              <button type="button" onClick={() => setPickerYear(pickerYear + 1)} aria-label="Next year" className={navBtnClass}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* Month grid */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {MONTH_SHORT.map((mName, mIdx) => {
                const isCurrent = pickerYear === year && mIdx === month;
                const isNow = pickerYear === today.getFullYear() && mIdx === today.getMonth();
                return (
                  <button
                    key={mIdx}
                    type="button"
                    onClick={() => selectPickerMonth(mIdx)}
                    className={
                      "rounded-lg py-2.5 text-sm font-medium transition-colors " +
                      (isCurrent
                        ? "bg-brand-primary text-white "
                        : isNow
                          ? "border border-brand-primary text-brand-primary "
                          : "text-brand-tertiary hover:bg-brand-primary/10 dark:text-white ")
                    }
                  >
                    {mName}
                  </button>
                );
              })}
            </div>

            {/* Quick actions */}
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={goToday} className="btn-primary flex-1 py-2.5">
                Go to Today
              </button>
              <button type="button" onClick={() => setPickerOpen(false)} className="btn-outline flex-1 py-2.5">
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Calendar grid ── */}
      <div className="overflow-hidden rounded-xl border border-brand-primary/25 bg-white dark:bg-brand-tertiary dark:border-brand-primary/20">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-brand-primary/20 bg-brand-primary/8 dark:bg-brand-primary/15">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-brand-secondary dark:text-brand-primary">
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

            const statuses: VisitStatus[] = [];
            if (dayVisits) {
              const seen = new Set<VisitStatus>();
              for (const v of dayVisits) {
                if (!seen.has(v.status)) { seen.add(v.status); statuses.push(v.status); }
              }
            }

            return (
              <button
                key={`${cell.key}-${idx}`}
                type="button"
                onClick={() => setSelectedKey(cell.key)}
                className={
                  "relative flex flex-col items-center justify-start py-2 min-h-[52px] border-b border-r border-brand-primary/10 transition-colors dark:border-brand-primary/10 " +
                  (!cell.inMonth ? "text-brand-neutral/40 dark:text-brand-neutral/30 " : "text-brand-tertiary dark:text-white ") +
                  (isSelected ? "bg-brand-primary/12 " : "hover:bg-brand-primary/8 ") +
                  ((idx + 1) % 7 === 0 ? "border-r-0 " : "") +
                  (idx >= cells.length - 7 ? "border-b-0 " : "")
                }
              >
                <span
                  className={
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium " +
                    (isToday
                      ? "bg-brand-primary text-white "
                      : isSelected && cell.inMonth
                        ? "font-bold text-brand-primary "
                        : "")
                  }
                >
                  {cell.day}
                </span>

                {count > 0 && (
                  <div className="mt-0.5 flex items-center gap-0.5">
                    {statuses.slice(0, 3).map((s, i) => (
                      <span key={i} className={`inline-block h-1.5 w-1.5 rounded-full ${statusColor(s)}`} />
                    ))}
                    {count > 3 && (
                      <span className="text-[9px] font-medium text-brand-neutral ml-0.5">+{count - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected day detail ── */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-brand-neutral">
              {selectedDate.toLocaleDateString(undefined, { weekday: "long" })}
            </div>
            <div className="mt-0.5 text-base font-semibold text-brand-tertiary dark:text-white">
              {selectedDate.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>
          <div className="rounded-full bg-brand-primary/15 px-2.5 py-0.5 text-xs font-medium text-brand-secondary dark:text-brand-primary">
            {selectedDayVisits.length} {selectedDayVisits.length === 1 ? "visit" : "visits"}
          </div>
        </div>
      </div>

      {/* ── Visit cards ── */}
      <div className="space-y-2">
        {selectedDayVisits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-brand-primary/30 p-4 text-center text-sm text-brand-neutral">
            <svg className="mx-auto mb-2 h-8 w-8 text-brand-primary/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
              <div key={v.id} className="card p-3 transition-colors hover:border-brand-primary/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-brand-tertiary dark:text-white">
                      {v.customer.name}
                    </div>
                    <div className="mt-1 text-xs text-brand-neutral">{v.projectName}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs font-medium tabular-nums text-brand-tertiary dark:text-white">{timeLabel(d)}</div>
                    <div className="mt-1"><span className={statusPill(v.status)}>{v.status}</span></div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-brand-neutral">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <a href={`tel:${v.customer.mobileNumber}`} className="underline-offset-2 hover:underline hover:text-brand-primary">
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

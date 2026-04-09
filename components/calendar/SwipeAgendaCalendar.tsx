"use client";

import { useEffect, useMemo, useState } from "react";
import type { VisitStatus } from "@prisma/client";

type VisitCalendarRow = {
  id: string;
  dateTime: string | Date;
  status: VisitStatus;
  projectName: string;
  customer: {
    id: string;
    name: string;
    mobileNumber: string;
  };
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dayKey(d: Date) {
  // Local day grouping for field/mobile usability.
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dayLabel(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function shortDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function timeLabel(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function statusPill(status: VisitStatus) {
  if (status === "Converted") {
    return "rounded-md bg-green-50 px-2 py-1 text-[11px] text-green-800 dark:bg-green-950/30 dark:text-green-200";
  }
  if (status === "Completed") {
    return "rounded-md bg-emerald-50 px-2 py-1 text-[11px] text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200";
  }
  if (status === "Cancelled") {
    return "rounded-md bg-red-50 px-2 py-1 text-[11px] text-red-800 dark:bg-red-950/30 dark:text-red-200";
  }
  if (status === "Scheduled") {
    return "rounded-md bg-blue-50 px-2 py-1 text-[11px] text-blue-800 dark:bg-blue-950/30 dark:text-blue-200";
  }
  return "rounded-md bg-neutral-50 px-2 py-1 text-[11px] text-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-200";
}

export default function SwipeAgendaCalendar(props: {
  visits: VisitCalendarRow[];
  days?: number;
}) {
  const days = props.days ?? 14;
  const [mounted, setMounted] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dayOptions = useMemo(() => {
    const list: Array<{ key: string; date: Date }> = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      list.push({ key: dayKey(d), date: d });
    }
    return list;
  }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  const [selectedKey, setSelectedKey] = useState(dayKey(today));

  const selectedDate = useMemo(() => {
    return dayOptions.find((x) => x.key === selectedKey)?.date ?? today;
  }, [dayOptions, selectedKey, today]);

  const visitsForSelectedDay = useMemo(() => {
    const items = props.visits
      .map((v) => ({ ...v, date: new Date(v.dateTime) }))
      .filter((v) => dayKey(v.date) === selectedKey)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    return items;
  }, [props.visits, selectedKey]);

  if (!mounted) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-sm text-neutral-600 dark:text-neutral-300">
            Loading agenda...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-sm text-neutral-600 dark:text-neutral-300">
              Agenda
            </div>
            <div className="mt-1 text-base font-semibold">
              {shortDate(selectedDate)}
            </div>
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Swipe days
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          className="flex gap-2 px-0.5 pb-2"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {dayOptions.map((d) => {
            const active = d.key === selectedKey;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setSelectedKey(d.key)}
                className={
                  "snap-start shrink-0 rounded-xl border px-3 py-2 text-center " +
                  (active
                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-900"
                    : "border-neutral-200 bg-white text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50")
                }
                style={{ scrollSnapAlign: "start" }}
              >
                <div className="text-[11px] font-medium">{dayLabel(d.date)}</div>
                <div className="mt-0.5 text-xs font-semibold">
                  {d.date.getDate()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        {visitsForSelectedDay.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
            No visits for this day.
          </div>
        ) : (
          visitsForSelectedDay.map((v) => {
            const d = v.date;
            return (
              <div
                key={v.id}
                className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {v.customer.name}
                    </div>
                    <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                      {v.projectName}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs font-medium">{timeLabel(d)}</div>
                    <div className="mt-1">
                      <span className={statusPill(v.status)}>{v.status}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                  {v.customer.mobileNumber}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


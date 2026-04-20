"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type AccountMenuProps = {
  name: string;
  email: string;
  roleLabel: string;
  statusLabel: string;
  canManageUsers: boolean;
};

export default function AccountMenu(props: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const supabase = createClient();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/sign-in");
  }

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:hover:bg-neutral-900"
        aria-label="Open account menu"
        aria-expanded={open}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-800 dark:bg-neutral-950">
          <div className="space-y-0.5">
            <div className="truncate text-sm font-semibold">{props.name}</div>
            <div className="truncate text-xs text-neutral-600 dark:text-neutral-300">
              {props.email}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md border border-neutral-200 p-2 dark:border-neutral-800">
              <div className="text-neutral-500 dark:text-neutral-400">Role</div>
              <div className="mt-1 font-medium">{props.roleLabel}</div>
            </div>
            <div className="rounded-md border border-neutral-200 p-2 dark:border-neutral-800">
              <div className="text-neutral-500 dark:text-neutral-400">Status</div>
              <div className="mt-1 font-medium">{props.statusLabel}</div>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="block rounded-md border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
            >
              Dashboard
            </Link>

            {props.canManageUsers ? (
              <Link
                href="/admin/user-management"
                onClick={() => setOpen(false)}
                className="block rounded-md border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
              >
                User approvals
              </Link>
            ) : null}

            <button
              type="button"
              onClick={handleLogout}
              className="block w-full rounded-md bg-neutral-900 px-3 py-2 text-left text-sm text-white hover:opacity-90 dark:bg-neutral-50 dark:text-neutral-900"
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

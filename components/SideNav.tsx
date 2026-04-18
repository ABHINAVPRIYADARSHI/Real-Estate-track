"use client";

import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";

type SideNavProps = {
  name: string;
  email: string;
  roleLabel: string;
  statusLabel: string;
  canManageUsers: boolean;
  canManageProjects: boolean;
};

const NAV_LINKS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/dashboard/customers",
    label: "Customers",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/dashboard/visits",
    label: "Visits",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

export default function SideNav(props: SideNavProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const navLinkClass = (active: boolean) =>
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors " +
    (active
      ? "bg-brand-primary text-white"
      : "text-white/70 hover:bg-white/10 hover:text-white");

  const overlay = open ? (
    <>
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(8,29,38,0.72)" }}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Side drawer — shares the same brand-tertiary dark as the header */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        style={{
          position: "fixed",
          top: 0, left: 0, bottom: 0,
          width: "288px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          boxShadow: "6px 0 40px rgba(8,29,38,0.45)",
        }}
        className="bg-brand-tertiary"
      >
        {/* ── Drawer header ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="text-sm font-semibold tracking-tight text-white">Work Tracker</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* ── User info ── */}
        <div className="shrink-0 border-b border-white/10 px-4 py-3">
          <div className="truncate text-sm font-semibold text-white">{props.name}</div>
          <div className="mt-0.5 truncate text-xs text-white/55">{props.email}</div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-brand-primary/25 px-2 py-0.5 text-xs font-medium text-brand-primary">
              {props.roleLabel}
            </span>
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-white/70">
              {props.statusLabel}
            </span>
          </div>
        </div>

        {/* ── Navigation links ── */}
        <nav className="flex-1 px-3 py-3">
          <div className="flex flex-col gap-0.5">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={navLinkClass(isActive(link.href))}>
                {link.icon}
                {link.label}
              </Link>
            ))}

            {props.canManageProjects && (
              <Link href="/admin/projects" className={navLinkClass(pathname === "/admin/projects")}>
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Projects
              </Link>
            )}

            {props.canManageUsers && (
              <Link href="/admin/user-management" className={navLinkClass(pathname.startsWith("/admin/user"))}>
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                User Approvals
              </Link>
            )}
          </div>
        </nav>

        {/* ── Logout ── */}
        <div className="shrink-0 border-t border-white/10 px-3 py-3">
          <SignOutButton>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/15 hover:text-red-300"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </SignOutButton>
        </div>
      </div>
    </>
  ) : null;

  return (
    <>
      {/* ── Hamburger trigger (lives in the dark header) ── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 hover:border-white/40"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" />
        </svg>
      </button>

      {mounted && createPortal(overlay, document.body)}
    </>
  );
}

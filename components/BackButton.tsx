"use client";

import { useRouter, usePathname } from "next/navigation";

const ROOT_PATHS = ["/", "/dashboard", "/sign-in", "/sign-up"];

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  const isRoot = ROOT_PATHS.some(
    (root) => pathname === root || pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")
  );

  if (isRoot) return null;

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Go back"
      className="inline-flex items-center justify-center rounded-md p-1.5 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </svg>
    </button>
  );
}

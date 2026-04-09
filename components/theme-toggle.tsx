"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resolvedTheme = mounted ? theme ?? systemTheme : "system";

  return (
    <button
      type="button"
      className="rounded-md border border-neutral-200/70 bg-white/70 px-2 py-1 text-xs font-medium text-neutral-900 dark:border-neutral-800/70 dark:bg-neutral-950/70 dark:text-neutral-50"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle light/dark mode"
    >
      {resolvedTheme === "dark" ? "Dark" : "Light"}
    </button>
  );
}


"use client";

import { useEffect, useState } from "react";

type SnackbarType = "success" | "error";

type Props = {
  message: string;
  type?: SnackbarType;
  /** Auto-dismiss after this many ms. Default 3000. */
  duration?: number;
  onClose: () => void;
};

export default function Snackbar({
  message,
  type = "success",
  duration = 3000,
  onClose,
}: Props) {
  const [visible, setVisible] = useState(false);

  // Fade in on mount, then auto-dismiss.
  useEffect(() => {
    // Tick so the enter transition fires.
    const enter = requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      // Give the fade-out time to finish before unmounting.
      setTimeout(onClose, 300);
    }, duration);

    return () => {
      cancelAnimationFrame(enter);
      clearTimeout(timer);
    };
  }, [duration, onClose]);

  const base =
    "fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all duration-300";

  const colours =
    type === "success"
      ? "bg-green-600 text-white dark:bg-green-500"
      : "bg-red-600 text-white dark:bg-red-500";

  const icon = type === "success" ? "✓" : "✕";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${base} ${colours} ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
        {icon}
      </span>
      {message}
    </div>
  );
}

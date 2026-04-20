"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin top-bar progress indicator that animates on every route change.
 * No external dependency — pure CSS animation.
 */
export default function TopProgressBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  // Reset and replay animation on every pathname change
  useEffect(() => {
    // Start
    setWidth(0);
    setVisible(true);

    // Animate to ~80% quickly, then stall
    rafRef.current = requestAnimationFrame(() => {
      setTimeout(() => setWidth(72), 20);
    });

    // Finish after a short delay (simulates navigation complete)
    timerRef.current = setTimeout(() => {
      setWidth(100);
      // Hide after the fill animation completes
      setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 300);
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "3px",
        zIndex: 99999,
        width: `${width}%`,
        transition: width === 100 ? "width 200ms ease-in" : "width 350ms cubic-bezier(0.4,0,0.2,1)",
        background: "linear-gradient(90deg, #2D9DA0 0%, #00C9CC 60%, #2D9DA0 100%)",
        boxShadow: "0 0 10px #2D9DA0, 0 0 4px #00C9CC",
        borderRadius: "0 2px 2px 0",
      }}
      role="progressbar"
      aria-label="Page loading"
    />
  );
}

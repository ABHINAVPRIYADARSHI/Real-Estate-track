"use client";

import { useEffect, useMemo, useState } from "react";

export default function PwaInstallBanner() {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  const isAndroid = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /Android/i.test(navigator.userAgent || "");
  }, []);

  useEffect(() => {
    if (!isAndroid) return;

    const onBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile.
      e.preventDefault();
      setPromptEvent(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstallPrompt
      );
    };
  }, [isAndroid]);

  async function onInstall() {
    if (!promptEvent) return;

    promptEvent.prompt();
    try {
      await promptEvent.userChoice;
    } finally {
      setIsVisible(false);
      setPromptEvent(null);
    }
  }

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-3 left-0 right-0 z-50 mx-auto w-full max-w-sm px-3">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            Install this app
          </div>
          <div className="truncate text-xs text-neutral-600 dark:text-neutral-300">
            Add to your home screen for quick access.
          </div>
        </div>
        <button
          type="button"
          onClick={onInstall}
          className="shrink-0 rounded-md bg-neutral-900 px-3 py-2 text-xs font-medium text-white dark:bg-neutral-50 dark:text-neutral-900"
        >
          Install App
        </button>
      </div>
    </div>
  );
}


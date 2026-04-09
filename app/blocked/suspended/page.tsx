export default function BlockedSuspendedPage() {
  return (
    <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h1 className="text-lg font-semibold">Access suspended</h1>
      <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
        Your account is currently suspended. Please contact an Admin if you
        believe this is a mistake.
      </p>
    </div>
  );
}


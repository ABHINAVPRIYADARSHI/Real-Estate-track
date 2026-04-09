export default function BlockedPendingPage() {
  return (
    <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h1 className="text-lg font-semibold">Access pending</h1>
      <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
        Your account is waiting for approval by an Admin. Once approved, you
        will be able to access the dashboard.
      </p>
    </div>
  );
}


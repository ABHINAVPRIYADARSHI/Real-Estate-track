import Spinner from "@/components/ui/Spinner";

export default function AdminLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-sm text-brand-neutral animate-pulse">Loading…</p>
    </div>
  );
}

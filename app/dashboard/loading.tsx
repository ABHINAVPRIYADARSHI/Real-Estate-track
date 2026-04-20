import Spinner from "@/components/ui/Spinner";

/** Dashboard section loading — shown while server components fetch data */
export default function DashboardLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* Outer ring */}
        <span
          className="block h-14 w-14 rounded-full border-4 border-solid border-brand-primary/15 border-t-brand-primary animate-spin"
          style={{ animationDuration: "0.8s" }}
        />
        {/* Inner ring — counter-spin */}
        <span
          className="absolute inset-0 m-auto block h-8 w-8 rounded-full border-[3px] border-solid border-brand-secondary/20 border-b-brand-secondary animate-spin"
          style={{ animationDuration: "1.2s", animationDirection: "reverse" }}
        />
      </div>
      <p className="text-sm text-brand-neutral animate-pulse">Loading data…</p>
    </div>
  );
}

type SpinnerProps = {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  label?: string;
};

const sizeMap = {
  xs: "h-3.5 w-3.5 border-[2px]",
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-12 w-12 border-4",
};

/**
 * Reusable circular spinner using brand colors.
 * Use size="sm" inline, size="md/lg" for full-page loaders.
 */
export default function Spinner({ size = "md", className = "", label = "Loading…" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-flex items-center justify-center ${className}`}
    >
      <span
        className={`animate-spin rounded-full border-solid border-brand-primary/25 border-t-brand-primary ${sizeMap[size]}`}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

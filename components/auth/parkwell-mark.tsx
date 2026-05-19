import { cn } from "@/lib/utils";

export function ParkwellMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.02]",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 text-parkwell-blue"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M5 7l7 7 7-7" />
        <path d="M5 14l7 7 7-7" opacity="0.5" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
    </div>
  );
}

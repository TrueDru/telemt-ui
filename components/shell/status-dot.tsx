import { cn } from "@/lib/utils";

export type HealthState = "ok" | "degraded" | "down" | "unknown";

const COLORS: Record<HealthState, string> = {
  ok: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
  unknown: "bg-zinc-400",
};

export function StatusDot({ state, pulse }: { state: HealthState; pulse?: boolean }) {
  return (
    <span className="relative inline-flex size-2 shrink-0">
      {pulse && (
        <span
          className={cn(
            "absolute inline-flex size-full animate-ping rounded-full opacity-75",
            COLORS[state],
          )}
        />
      )}
      <span className={cn("relative inline-flex size-2 rounded-full", COLORS[state])} />
    </span>
  );
}

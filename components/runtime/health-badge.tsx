import { Badge } from "@/components/ui/badge";

/** Renders a state label as a badge, highlighted destructive when it isn't one of `okValues`. */
export function HealthBadge({ state, okValues = ["ok"] }: { state: string; okValues?: string[] }) {
  return (
    <Badge variant={okValues.includes(state) ? "outline" : "destructive"} className="font-mono">
      {state}
    </Badge>
  );
}

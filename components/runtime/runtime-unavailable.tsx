import { AlertTriangle, PowerOff } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

/** Shared empty state for `{enabled:false}` / `data:null` runtime envelopes. */
export function RuntimeUnavailable({ reason }: { reason?: string | null }) {
  if (reason === "feature_disabled") {
    return (
      <EmptyState
        icon={PowerOff}
        title="Feature disabled"
        description="This diagnostic is disabled on this instance's configuration."
        reason={reason}
      />
    );
  }
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Data unavailable"
      description="The instance couldn't produce a snapshot for this panel right now."
      reason={reason ?? undefined}
    />
  );
}

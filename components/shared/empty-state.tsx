import { Inbox, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Machine-readable reason from the API, e.g. `feature_disabled` / `source_unavailable`. */
  reason?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, description, reason }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <Icon className="text-muted-foreground size-6" />
      <div className="text-sm font-medium">{title}</div>
      {description && <p className="text-muted-foreground max-w-xs text-xs">{description}</p>}
      {reason && (
        <Badge variant="outline" className="font-mono text-[10px]">
          {reason}
        </Badge>
      )}
    </div>
  );
}

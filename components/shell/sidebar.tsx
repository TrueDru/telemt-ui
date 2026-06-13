import type { TelemtInstance } from "@/lib/env";
import { SidebarNav } from "./sidebar-nav";
import type { HealthState } from "./status-dot";

interface SidebarProps {
  instances: TelemtInstance[];
  current: TelemtInstance;
  health: HealthState;
}

export function Sidebar({ instances, current, health }: SidebarProps) {
  return (
    <aside className="bg-sidebar text-sidebar-foreground hidden w-60 shrink-0 flex-col border-r md:flex">
      <SidebarNav instances={instances} current={current} health={health} />
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TelemtInstance } from "@/lib/env";
import { NAV } from "./nav";
import { InstanceSwitcher } from "./instance-switcher";
import { StatusDot, type HealthState } from "./status-dot";

interface SidebarNavProps {
  instances: TelemtInstance[];
  current: TelemtInstance;
  health: HealthState;
  onNavigate?: () => void;
}

export function SidebarNav({ instances, current, health, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-4">
        <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
          <Zap className="size-4" />
        </span>
        <span className="text-base font-semibold">
          tele<b>mt</b>
        </span>
      </div>
      <div className="px-3 pb-3">
        <InstanceSwitcher instances={instances} current={current} health={health} />
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        {NAV.map((section) => (
          <div key={section.title}>
            <div className="text-muted-foreground px-2 pb-1 text-xs font-medium">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="text-muted-foreground flex items-center gap-2 border-t px-4 py-3 text-xs">
        <StatusDot state={health} pulse />
        <span>
          Control API <span className="font-mono">v1</span> ·{" "}
          {health === "ok" ? "connected" : health === "down" ? "unreachable" : "degraded"}
        </span>
      </div>
    </>
  );
}

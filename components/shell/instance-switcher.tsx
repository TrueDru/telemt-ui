"use client";

import { Check, ChevronsUpDown, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setInstance } from "@/lib/auth/actions";
import type { TelemtInstance } from "@/lib/env";
import { StatusDot, type HealthState } from "./status-dot";

interface InstanceSwitcherProps {
  instances: TelemtInstance[];
  current: TelemtInstance;
  health: HealthState;
}

export function InstanceSwitcher({ instances, current, health }: InstanceSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" className="w-full justify-between px-2" />}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Server className="text-muted-foreground size-3.5 shrink-0" />
          <span className="flex min-w-0 items-center gap-1.5">
            <StatusDot state={health} pulse />
            <span className="truncate text-sm font-medium">{current.label}</span>
          </span>
        </span>
        <ChevronsUpDown className="text-muted-foreground size-3.5 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-(--anchor-width)">
        {instances.map((instance) => (
          <DropdownMenuItem
            key={instance.id}
            onClick={() => setInstance(instance.id)}
            className="justify-between gap-3"
          >
            <span className="flex items-center gap-2">
              <StatusDot state={instance.id === current.id ? health : "unknown"} />
              {instance.label}
            </span>
            {instance.id === current.id && <Check className="size-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

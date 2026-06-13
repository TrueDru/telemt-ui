"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { TelemtInstance } from "@/lib/env";
import { SidebarNav } from "./sidebar-nav";
import type { HealthState } from "./status-dot";

interface MobileNavProps {
  instances: TelemtInstance[];
  current: TelemtInstance;
  health: HealthState;
}

export function MobileNav({ instances, current, health }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation" />
        }
      >
        <Menu className="size-4" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="bg-sidebar text-sidebar-foreground flex w-60 max-w-[80%] flex-col gap-0 p-0"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">telemt-ui navigation menu</SheetDescription>
        <SidebarNav
          instances={instances}
          current={current}
          health={health}
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

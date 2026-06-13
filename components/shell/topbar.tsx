"use client";

import { usePathname } from "next/navigation";
import { ChevronRight, LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TelemtInstance } from "@/lib/env";
import { logout } from "@/lib/auth/actions";
import { ThemeToggle } from "./theme-toggle";
import { PAGE_TITLES } from "./nav";

export function Topbar({ current }: { current: TelemtInstance }) {
  const pathname = usePathname();
  const [section, label] = PAGE_TITLES[pathname] ?? ["", ""];

  return (
    <header className="flex h-12 items-center gap-3 border-b px-4">
      <div className="flex items-center gap-1.5 overflow-hidden text-sm">
        <span className="text-muted-foreground truncate font-mono text-xs">{current.label}</span>
        {section && (
          <>
            <ChevronRight className="text-muted-foreground size-3.5 shrink-0" />
            <span className="text-muted-foreground">{section}</span>
          </>
        )}
        {label && (
          <>
            <ChevronRight className="text-muted-foreground size-3.5 shrink-0" />
            <span className="font-medium">{label}</span>
          </>
        )}
      </div>
      <div className="flex-1" />
      <div className="bg-background text-muted-foreground hidden items-center gap-2 rounded-md border px-2.5 py-1 text-xs sm:flex">
        <Search className="size-3.5" />
        <span>Search users, IPs…</span>
        <kbd className="bg-muted rounded border px-1 font-mono text-[10px]">⌘K</kbd>
      </div>
      <ThemeToggle />
      <form action={logout}>
        <Button variant="ghost" size="icon" aria-label="Sign out" type="submit">
          <LogOut className="size-4" />
        </Button>
      </form>
    </header>
  );
}

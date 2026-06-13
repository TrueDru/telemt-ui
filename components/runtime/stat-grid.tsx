import type { ReactNode } from "react";

export function StatGrid({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col gap-0.5 rounded-md border p-2.5">
          <div className="text-muted-foreground text-xs">{it.label}</div>
          <div className="text-sm font-medium tabular-nums">{it.value}</div>
        </div>
      ))}
    </div>
  );
}

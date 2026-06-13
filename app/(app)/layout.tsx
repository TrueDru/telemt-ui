import { getEnv } from "@/lib/env";
import { getCurrentInstance } from "@/lib/instance";
import { telemt } from "@/lib/telemt/client";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import type { HealthState } from "@/components/shell/status-dot";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { instances } = getEnv();
  const current = await getCurrentInstance();

  let health: HealthState = "down";
  try {
    const { data } = await telemt.health(current.id);
    health = data.status.toLowerCase() === "ok" ? "ok" : "degraded";
  } catch {
    health = "down";
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar instances={instances} current={current} health={health} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar instances={instances} current={current} health={health} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

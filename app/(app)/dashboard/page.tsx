import type { ReactNode } from "react";
import { Activity, Clock, Globe, History, Shield, Users, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusDot, type HealthState } from "@/components/shell/status-dot";
import { cn } from "@/lib/utils";
import { getCurrentInstance } from "@/lib/instance";
import { telemt, type TelemtResult } from "@/lib/telemt/client";
import { fmtNum, fmtUptime, relTime } from "@/lib/format";
import type {
  HealthData,
  RuntimeEdgeEventsData,
  RuntimeGatesData,
  SummaryData,
} from "@/lib/telemt/schemas/system";

async function safe<T>(p: Promise<TelemtResult<T>>): Promise<T | null> {
  try {
    return (await p).data;
  } catch {
    return null;
  }
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1.5 px-4 py-3.5">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Icon className="size-3.5" />
          {label}
        </div>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        {sub && <div className="text-muted-foreground text-xs">{sub}</div>}
      </CardContent>
    </Card>
  );
}

interface Gate {
  label: string;
  desc: string;
  state: HealthState;
}

const GATE_TINT: Record<HealthState, string> = {
  ok: "border-emerald-500/20 bg-emerald-500/[0.04]",
  degraded: "border-amber-500/20 bg-amber-500/[0.04]",
  down: "border-red-500/20 bg-red-500/[0.04]",
  unknown: "border-border",
};

function eventSeverity(eventType: string): HealthState {
  const t = eventType.toLowerCase();
  if (/(error|fail|bad|denied|reject)/.test(t)) return "down";
  if (/(warn|degrad|expire|throttle|reroute|retry)/.test(t)) return "degraded";
  return "unknown";
}

function buildGates(gates: RuntimeGatesData): Gate[] {
  return [
    {
      label: "Admission",
      desc: gates.accepting_new_connections
        ? "Accepting new connections"
        : "New connections are being rejected",
      state: gates.accepting_new_connections ? "ok" : "down",
    },
    {
      label: "ME runtime",
      desc: !gates.use_middle_proxy
        ? "Middle-proxy transport disabled"
        : gates.me_runtime_ready
          ? "Middle-proxy runtime ready"
          : "Middle-proxy runtime not ready",
      state: !gates.use_middle_proxy ? "unknown" : gates.me_runtime_ready ? "ok" : "degraded",
    },
    {
      label: "Reroute",
      desc: gates.reroute_active
        ? `Routing to Direct-DC (${gates.reroute_reason ?? "active"})`
        : "No active reroute to Direct-DC",
      state: gates.reroute_active ? "degraded" : "ok",
    },
    {
      label: "Startup",
      desc: `${gates.startup_stage} · ${gates.startup_progress_pct.toFixed(0)}%`,
      state:
        gates.startup_status === "ready"
          ? "ok"
          : gates.startup_status === "failed"
            ? "down"
            : gates.startup_status === "skipped"
              ? "unknown"
              : "degraded",
    },
  ];
}

export default async function DashboardPage() {
  const current = await getCurrentInstance();

  const [summary, gatesData, health, events] = await Promise.all([
    safe<SummaryData>(telemt.summary(current.id)),
    safe<RuntimeGatesData>(telemt.runtimeGates(current.id)),
    safe<HealthData>(telemt.health(current.id)),
    safe<RuntimeEdgeEventsData>(telemt.runtimeEvents(current.id, 8)),
  ]);

  const gates = gatesData ? buildGates(gatesData) : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Live overview of {current.label}</p>
        </div>
        {health && (
          <Badge variant={health.read_only ? "secondary" : "outline"}>
            {health.read_only ? "Read-only" : "Read-write"}
          </Badge>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Uptime"
          value={summary ? fmtUptime(summary.uptime_seconds) : "—"}
        />
        <StatCard
          icon={Activity}
          label="Connections"
          value={summary ? fmtNum(summary.connections_total) : "—"}
          sub={summary ? `${fmtNum(summary.connections_bad_total)} bad` : undefined}
        />
        <StatCard
          icon={Users}
          label="Configured users"
          value={summary ? fmtNum(summary.configured_users) : "—"}
        />
        <StatCard
          icon={Globe}
          label="Route mode"
          value={<span className="font-mono text-base">{gatesData?.route_mode ?? "—"}</span>}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-1.5 text-sm">
              <Shield className="text-muted-foreground size-4" />
              Admission &amp; readiness gates
            </CardTitle>
            {gatesData && (
              <Badge variant="outline">
                {gates.filter((g) => g.state === "ok").length}/{gates.length} ok
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {gatesData ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {gates.map((g) => (
                  <div
                    key={g.label}
                    className={cn(
                      "flex items-start gap-2 rounded-md border p-2.5",
                      GATE_TINT[g.state],
                    )}
                  >
                    <StatusDot state={g.state} pulse={g.state === "ok"} />
                    <div className="flex flex-col gap-0.5">
                      <div className="text-sm font-medium">{g.label}</div>
                      <div className="text-muted-foreground text-xs">{g.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Gates unavailable"
                description="Couldn't load runtime gates from this instance."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-sm">
              <History className="text-muted-foreground size-4" />
              Recent events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!events ? (
              <EmptyState
                title="Events unavailable"
                description="Couldn't load recent events from this instance."
              />
            ) : !events.enabled ? (
              <EmptyState
                title="Events disabled"
                description="Enable `server.api.runtime_edge_enabled` to see recent events."
                reason={events.reason ?? "feature_disabled"}
              />
            ) : !events.data || events.data.events.length === 0 ? (
              <EmptyState title="No recent events" />
            ) : (
              <div className="flex flex-col divide-y">
                {events.data.events.map((e) => (
                  <div key={e.seq} className="flex items-center gap-3 py-2 text-sm">
                    <StatusDot state={eventSeverity(e.event_type)} />
                    <span className="text-muted-foreground font-mono text-xs">{e.event_type}</span>
                    <span className="text-muted-foreground flex-1 truncate text-xs">
                      {e.context}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {relTime(e.ts_epoch_secs * 1000)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RuntimePanel } from "@/components/runtime/runtime-panel";
import { RuntimeUnavailable } from "@/components/runtime/runtime-unavailable";
import { StatGrid } from "@/components/runtime/stat-grid";
import { useNatStunQuery } from "@/components/runtime/queries";
import { fmtNum, relTime } from "@/lib/format";
import type { TelemtResult } from "@/lib/telemt/client";
import type { RuntimeNatStunData } from "@/lib/telemt/schemas/runtime";

export function NatStunPanel({
  instanceId,
  initial,
}: {
  instanceId: string;
  initial?: TelemtResult<RuntimeNatStunData>;
}) {
  const query = useNatStunQuery(instanceId, initial);
  return (
    <RuntimePanel query={query}>
      {(res) => {
        if (!res.enabled || !res.data) return <RuntimeUnavailable reason={res.reason} />;
        const { flags, servers, reflection, stun_backoff_remaining_ms } = res.data;
        return (
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-sm">NAT probe</CardTitle>
                <div className="flex gap-2">
                  <Badge variant={flags.nat_probe_enabled ? "outline" : "secondary"}>
                    {flags.nat_probe_enabled ? "enabled" : "disabled"}
                  </Badge>
                  {flags.nat_probe_disabled_runtime && (
                    <Badge variant="destructive">runtime-disabled</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <StatGrid
                  items={[
                    { label: "Configured attempts", value: fmtNum(flags.nat_probe_attempts) },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">STUN servers</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <StatGrid
                  items={[
                    { label: "Configured", value: fmtNum(servers.configured.length) },
                    { label: "Live", value: fmtNum(servers.live_total) },
                    {
                      label: "Backoff remaining",
                      value:
                        stun_backoff_remaining_ms != null
                          ? `${fmtNum(stun_backoff_remaining_ms)} ms`
                          : "—",
                    },
                  ]}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-muted-foreground mb-1.5 text-xs font-medium">
                      Configured servers
                    </div>
                    <div className="flex flex-col gap-1 font-mono text-xs">
                      {servers.configured.length === 0 ? (
                        <span className="text-muted-foreground">none</span>
                      ) : (
                        servers.configured.map((s) => <span key={s}>{s}</span>)
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1.5 text-xs font-medium">
                      Live servers
                    </div>
                    <div className="flex flex-col gap-1 font-mono text-xs">
                      {servers.live.length === 0 ? (
                        <span className="text-muted-foreground">none</span>
                      ) : (
                        servers.live.map((s) => <span key={s}>{s}</span>)
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Reflection cache</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["v4", "v6"] as const).map((fam) => {
                    const r = reflection[fam];
                    return (
                      <div key={fam} className="rounded-md border p-2.5">
                        <div className="text-muted-foreground mb-1 text-xs font-medium">
                          IP{fam}
                        </div>
                        {r ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-sm">{r.addr}</span>
                            <span className="text-muted-foreground text-xs">
                              {fmtNum(r.age_secs)}s ago
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">unknown</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <p className="text-muted-foreground text-xs">
              Snapshot generated {relTime(res.generated_at_epoch_secs * 1000)}.
            </p>
          </div>
        );
      }}
    </RuntimePanel>
  );
}

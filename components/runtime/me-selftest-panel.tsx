"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthBadge } from "@/components/runtime/health-badge";
import { RuntimePanel } from "@/components/runtime/runtime-panel";
import { RuntimeUnavailable } from "@/components/runtime/runtime-unavailable";
import { StatGrid } from "@/components/runtime/stat-grid";
import { useMeSelftestQuery } from "@/components/runtime/queries";
import { fmtNum, relTime } from "@/lib/format";
import type { TelemtResult } from "@/lib/telemt/client";
import type { RuntimeMeSelftestData } from "@/lib/telemt/schemas/runtime";

export function MeSelftestPanel({
  instanceId,
  initial,
}: {
  instanceId: string;
  initial?: TelemtResult<RuntimeMeSelftestData>;
}) {
  const query = useMeSelftestQuery(instanceId, initial);
  return (
    <RuntimePanel query={query}>
      {(res) => {
        if (!res.enabled || !res.data) return <RuntimeUnavailable reason={res.reason} />;
        const { kdf, timeskew, ip, pid, bnd } = res.data;
        return (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-sm">KDF</CardTitle>
                  <HealthBadge state={kdf.state} />
                </CardHeader>
                <CardContent>
                  <StatGrid
                    items={[
                      { label: "EWMA errors/min", value: kdf.ewma_errors_per_min.toFixed(2) },
                      {
                        label: "Threshold errors/min",
                        value: kdf.threshold_errors_per_min.toFixed(2),
                      },
                      { label: "Total errors", value: fmtNum(kdf.errors_total) },
                    ]}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-sm">Time skew</CardTitle>
                  <HealthBadge state={timeskew.state} />
                </CardHeader>
                <CardContent>
                  <StatGrid
                    items={[
                      {
                        label: "Max skew (15m)",
                        value:
                          timeskew.max_skew_secs_15m != null
                            ? `${fmtNum(timeskew.max_skew_secs_15m)}s`
                            : "—",
                      },
                      { label: "Samples (15m)", value: fmtNum(timeskew.samples_15m) },
                      {
                        label: "Last skew",
                        value:
                          timeskew.last_skew_secs != null
                            ? `${fmtNum(timeskew.last_skew_secs)}s`
                            : "—",
                      },
                      { label: "Last source", value: timeskew.last_source ?? "—" },
                      {
                        label: "Last seen",
                        value:
                          timeskew.last_seen_age_secs != null
                            ? `${fmtNum(timeskew.last_seen_age_secs)}s ago`
                            : "—",
                      },
                    ]}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Interface IP</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {(["v4", "v6"] as const).map((fam) => {
                      const f = ip[fam];
                      return (
                        <div key={fam} className="flex flex-col gap-1 rounded-md border p-2.5">
                          <div className="text-muted-foreground text-xs font-medium">IP{fam}</div>
                          {f ? (
                            <>
                              <span className="font-mono text-sm">{f.addr}</span>
                              <HealthBadge state={f.state} okValues={["good"]} />
                            </>
                          ) : (
                            <span className="text-muted-foreground text-sm">unknown</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-sm">Process PID</CardTitle>
                  <HealthBadge state={pid.state} okValues={["one", "non-one"]} />
                </CardHeader>
                <CardContent>
                  <StatGrid items={[{ label: "PID", value: fmtNum(pid.pid) }]} />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-sm">SOCKS BND.ADDR / BND.PORT</CardTitle>
                  <div className="flex gap-2">
                    <HealthBadge state={bnd.addr_state} okValues={["ok"]} />
                    <HealthBadge state={bnd.port_state} okValues={["ok", "zero"]} />
                  </div>
                </CardHeader>
                <CardContent>
                  <StatGrid
                    items={[
                      { label: "Last address", value: bnd.last_addr ?? "—" },
                      {
                        label: "Last seen",
                        value:
                          bnd.last_seen_age_secs != null
                            ? `${fmtNum(bnd.last_seen_age_secs)}s ago`
                            : "—",
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            </div>

            <p className="text-muted-foreground text-xs">
              Snapshot generated {relTime(res.generated_at_epoch_secs * 1000)}.
            </p>
          </div>
        );
      }}
    </RuntimePanel>
  );
}

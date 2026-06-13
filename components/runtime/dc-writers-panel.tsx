"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { RuntimePanel } from "@/components/runtime/runtime-panel";
import { RuntimeUnavailable } from "@/components/runtime/runtime-unavailable";
import { StatGrid } from "@/components/runtime/stat-grid";
import { useMinimalAllQuery } from "@/components/runtime/queries";
import { fmtNum, relTime } from "@/lib/format";
import type { TelemtResult } from "@/lib/telemt/client";
import type { MinimalAllData } from "@/lib/telemt/schemas/runtime";

function Coverage({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <Progress value={Math.min(100, pct)} className="w-24" />
      <span className="text-muted-foreground text-xs tabular-nums">{pct.toFixed(0)}%</span>
    </div>
  );
}

export function DcWritersPanel({
  instanceId,
  initial,
}: {
  instanceId: string;
  initial?: TelemtResult<MinimalAllData>;
}) {
  const query = useMinimalAllQuery(instanceId, initial);
  return (
    <RuntimePanel query={query}>
      {(res) => {
        if (!res.enabled || !res.data) return <RuntimeUnavailable reason={res.reason} />;
        const { me_writers, dcs, me_runtime, network_path } = res.data;

        return (
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">ME writer coverage</CardTitle>
              </CardHeader>
              <CardContent>
                {!me_writers.middle_proxy_enabled ? (
                  <RuntimeUnavailable reason={me_writers.reason} />
                ) : (
                  <div className="flex flex-col gap-3">
                    <StatGrid
                      items={[
                        {
                          label: "Configured endpoints",
                          value: `${fmtNum(me_writers.summary.available_endpoints)} / ${fmtNum(
                            me_writers.summary.configured_endpoints,
                          )}`,
                        },
                        {
                          label: "Configured DC groups",
                          value: fmtNum(me_writers.summary.configured_dc_groups),
                        },
                        {
                          label: "Alive / required writers",
                          value: `${fmtNum(me_writers.summary.alive_writers)} / ${fmtNum(
                            me_writers.summary.required_writers,
                          )}`,
                        },
                        {
                          label: "Fresh alive writers",
                          value: fmtNum(me_writers.summary.fresh_alive_writers),
                        },
                      ]}
                    />
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-md border p-2.5">
                        <div className="text-muted-foreground mb-1 text-xs">
                          Available endpoints
                        </div>
                        <Coverage pct={me_writers.summary.available_pct} />
                      </div>
                      <div className="rounded-md border p-2.5">
                        <div className="text-muted-foreground mb-1 text-xs">Coverage</div>
                        <Coverage pct={me_writers.summary.coverage_pct} />
                      </div>
                      <div className="rounded-md border p-2.5">
                        <div className="text-muted-foreground mb-1 text-xs">Fresh coverage</div>
                        <Coverage pct={me_writers.summary.fresh_coverage_pct} />
                      </div>
                    </div>

                    {me_writers.writers.length === 0 ? (
                      <EmptyState title="No writers reported" />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>DC</TableHead>
                            <TableHead>Endpoint</TableHead>
                            <TableHead>Gen</TableHead>
                            <TableHead>State</TableHead>
                            <TableHead>Bound</TableHead>
                            <TableHead>RTT</TableHead>
                            <TableHead>Idle</TableHead>
                            <TableHead>Flags</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {me_writers.writers.map((w) => (
                            <TableRow key={w.writer_id}>
                              <TableCell>{w.writer_id}</TableCell>
                              <TableCell>{w.dc ?? "—"}</TableCell>
                              <TableCell className="font-mono text-xs">{w.endpoint}</TableCell>
                              <TableCell>{w.generation}</TableCell>
                              <TableCell>
                                <Badge variant={w.state === "active" ? "outline" : "secondary"}>
                                  {w.state}
                                </Badge>
                              </TableCell>
                              <TableCell>{fmtNum(w.bound_clients)}</TableCell>
                              <TableCell>
                                {w.rtt_ema_ms != null ? `${w.rtt_ema_ms.toFixed(1)} ms` : "—"}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs">
                                {w.idle_for_secs != null ? `${fmtNum(w.idle_for_secs)}s` : "—"}
                              </TableCell>
                              <TableCell className="flex flex-wrap gap-1">
                                {w.draining && <Badge variant="destructive">draining</Badge>}
                                {w.degraded && <Badge variant="destructive">degraded</Badge>}
                                {!w.matches_active_generation && (
                                  <Badge variant="secondary">stale gen</Badge>
                                )}
                                {!w.in_desired_map && <Badge variant="secondary">undesired</Badge>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">DC status</CardTitle>
              </CardHeader>
              <CardContent>
                {!dcs.middle_proxy_enabled ? (
                  <RuntimeUnavailable reason={dcs.reason} />
                ) : dcs.dcs.length === 0 ? (
                  <EmptyState title="No DCs reported" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>DC</TableHead>
                        <TableHead>Endpoints</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Floor (min/target/max)</TableHead>
                        <TableHead>Alive / required</TableHead>
                        <TableHead>Coverage</TableHead>
                        <TableHead>RTT</TableHead>
                        <TableHead>Load</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dcs.dcs.map((dc) => (
                        <TableRow key={dc.dc}>
                          <TableCell>{dc.dc}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {dc.available_endpoints} / {dc.endpoints.length}
                          </TableCell>
                          <TableCell>
                            <Coverage pct={dc.available_pct} />
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {dc.floor_min} / {dc.floor_target} / {dc.floor_max}
                            {dc.floor_capped && (
                              <Badge variant="secondary" className="ml-1.5">
                                capped
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {fmtNum(dc.alive_writers)} / {fmtNum(dc.required_writers)}
                          </TableCell>
                          <TableCell>
                            <Coverage pct={dc.coverage_pct} />
                          </TableCell>
                          <TableCell>
                            {dc.rtt_ms != null ? `${dc.rtt_ms.toFixed(1)} ms` : "—"}
                          </TableCell>
                          <TableCell>{fmtNum(dc.load)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {network_path.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Network path</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>DC</TableHead>
                        <TableHead>IP preference</TableHead>
                        <TableHead>Selected IPv4</TableHead>
                        <TableHead>Selected IPv6</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {network_path.map((p) => (
                        <TableRow key={p.dc}>
                          <TableCell>{p.dc}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {p.ip_preference ?? "—"}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {p.selected_addr_v4 ?? "—"}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {p.selected_addr_v6 ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {me_runtime && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">ME runtime tuning</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <StatGrid
                    items={Object.entries(me_runtime)
                      .filter(([key]) => key !== "quarantined_endpoints")
                      .map(([key, value]) => ({
                        label: key,
                        value: String(value),
                      }))}
                  />
                  {me_runtime.quarantined_endpoints.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Endpoint</TableHead>
                          <TableHead>Remaining</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {me_runtime.quarantined_endpoints.map((q) => (
                          <TableRow key={q.endpoint}>
                            <TableCell className="font-mono text-xs">{q.endpoint}</TableCell>
                            <TableCell>{fmtNum(q.remaining_ms)} ms</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            <p className="text-muted-foreground text-xs">
              Snapshot generated {relTime(res.generated_at_epoch_secs * 1000)}.
            </p>
          </div>
        );
      }}
    </RuntimePanel>
  );
}

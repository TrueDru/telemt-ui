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
import { HealthBadge } from "@/components/runtime/health-badge";
import { RuntimePanel } from "@/components/runtime/runtime-panel";
import { RuntimeUnavailable } from "@/components/runtime/runtime-unavailable";
import { StatGrid } from "@/components/runtime/stat-grid";
import { useMeQualityQuery } from "@/components/runtime/queries";
import { fmtNum, relFuture, relTime } from "@/lib/format";
import type { TelemtResult } from "@/lib/telemt/client";
import type { RuntimeMeQualityData } from "@/lib/telemt/schemas/runtime";

export function MeQualityPanel({
  instanceId,
  initial,
}: {
  instanceId: string;
  initial?: TelemtResult<RuntimeMeQualityData>;
}) {
  const query = useMeQualityQuery(instanceId, initial);
  return (
    <RuntimePanel query={query}>
      {(res) => {
        if (!res.enabled || !res.data) return <RuntimeUnavailable reason={res.reason} />;
        const { counters, route_drops, family_states, drain_gate, dc_rtt } = res.data;
        return (
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">ME lifecycle counters</CardTitle>
              </CardHeader>
              <CardContent>
                <StatGrid
                  items={[
                    {
                      label: "Idle close by peer",
                      value: fmtNum(counters.idle_close_by_peer_total),
                    },
                    { label: "Reader EOF", value: fmtNum(counters.reader_eof_total) },
                    { label: "KDF drift", value: fmtNum(counters.kdf_drift_total) },
                    {
                      label: "KDF port-only drift",
                      value: fmtNum(counters.kdf_port_only_drift_total),
                    },
                    {
                      label: "Reconnect attempts",
                      value: fmtNum(counters.reconnect_attempt_total),
                    },
                    {
                      label: "Reconnect successes",
                      value: fmtNum(counters.reconnect_success_total),
                    },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Route drops</CardTitle>
              </CardHeader>
              <CardContent>
                <StatGrid
                  items={[
                    { label: "No connection", value: fmtNum(route_drops.no_conn_total) },
                    { label: "Channel closed", value: fmtNum(route_drops.channel_closed_total) },
                    { label: "Queue full (total)", value: fmtNum(route_drops.queue_full_total) },
                    {
                      label: "Queue full (base)",
                      value: fmtNum(route_drops.queue_full_base_total),
                    },
                    {
                      label: "Queue full (high)",
                      value: fmtNum(route_drops.queue_full_high_total),
                    },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-sm">Drain gate</CardTitle>
                <div className="flex gap-2">
                  <Badge variant={drain_gate.route_quorum_ok ? "outline" : "destructive"}>
                    quorum {drain_gate.route_quorum_ok ? "ok" : "blocked"}
                  </Badge>
                  <Badge variant={drain_gate.redundancy_ok ? "outline" : "destructive"}>
                    redundancy {drain_gate.redundancy_ok ? "ok" : "blocked"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm">
                <span className="text-muted-foreground">Block reason: </span>
                <span className="font-mono">{drain_gate.block_reason}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · updated {relTime(drain_gate.updated_at_epoch_secs * 1000)}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Family states</CardTitle>
              </CardHeader>
              <CardContent>
                {family_states.length === 0 ? (
                  <EmptyState title="No families reported" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Family</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Since</TableHead>
                        <TableHead>Suppressed until</TableHead>
                        <TableHead>Fail streak</TableHead>
                        <TableHead>Recover streak</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {family_states.map((f) => (
                        <TableRow key={f.family}>
                          <TableCell className="font-mono text-xs">{f.family}</TableCell>
                          <TableCell>
                            <HealthBadge state={f.state} okValues={["active", "ok"]} />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {relTime(f.state_since_epoch_secs * 1000)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {f.suppressed_until_epoch_secs
                              ? relFuture(f.suppressed_until_epoch_secs * 1000)
                              : "—"}
                          </TableCell>
                          <TableCell>{fmtNum(f.fail_streak)}</TableCell>
                          <TableCell>{fmtNum(f.recover_success_streak)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Per-DC RTT &amp; coverage</CardTitle>
              </CardHeader>
              <CardContent>
                {dc_rtt.length === 0 ? (
                  <EmptyState title="No DC rows reported" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>DC</TableHead>
                        <TableHead>RTT (EMA)</TableHead>
                        <TableHead>Alive / required</TableHead>
                        <TableHead>Coverage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dc_rtt.map((row) => (
                        <TableRow key={row.dc}>
                          <TableCell>{row.dc}</TableCell>
                          <TableCell>
                            {row.rtt_ema_ms != null ? `${row.rtt_ema_ms.toFixed(1)} ms` : "—"}
                          </TableCell>
                          <TableCell>
                            {fmtNum(row.alive_writers)} / {fmtNum(row.required_writers)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={Math.min(100, row.coverage_pct)} className="w-24" />
                              <span className="text-muted-foreground text-xs tabular-nums">
                                {row.coverage_pct.toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
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

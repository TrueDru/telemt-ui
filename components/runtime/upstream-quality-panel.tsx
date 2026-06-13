"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RuntimePanel } from "@/components/runtime/runtime-panel";
import { RuntimeUnavailable } from "@/components/runtime/runtime-unavailable";
import { StatGrid } from "@/components/runtime/stat-grid";
import { useUpstreamQualityQuery } from "@/components/runtime/queries";
import { fmtNum, relTime } from "@/lib/format";
import type { TelemtResult } from "@/lib/telemt/client";
import type { RuntimeUpstreamQualityData } from "@/lib/telemt/schemas/runtime";

export function UpstreamQualityPanel({
  instanceId,
  initial,
}: {
  instanceId: string;
  initial?: TelemtResult<RuntimeUpstreamQualityData>;
}) {
  const query = useUpstreamQualityQuery(instanceId, initial);
  return (
    <RuntimePanel query={query}>
      {(res) => {
        const hasRuntimeRows = !!(res.summary || res.upstreams);
        return (
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Connect policy</CardTitle>
              </CardHeader>
              <CardContent>
                <StatGrid
                  items={[
                    { label: "Retry attempts", value: fmtNum(res.policy.connect_retry_attempts) },
                    {
                      label: "Retry backoff",
                      value: `${fmtNum(res.policy.connect_retry_backoff_ms)} ms`,
                    },
                    {
                      label: "Connect budget",
                      value: `${fmtNum(res.policy.connect_budget_ms)} ms`,
                    },
                    {
                      label: "Unhealthy threshold",
                      value: fmtNum(res.policy.unhealthy_fail_threshold),
                    },
                    {
                      label: "Fail-fast on hard errors",
                      value: (
                        <Badge
                          variant={
                            res.policy.connect_failfast_hard_errors ? "outline" : "secondary"
                          }
                        >
                          {res.policy.connect_failfast_hard_errors ? "yes" : "no"}
                        </Badge>
                      ),
                    },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Connect counters</CardTitle>
              </CardHeader>
              <CardContent>
                <StatGrid
                  items={[
                    { label: "Attempts", value: fmtNum(res.counters.connect_attempt_total) },
                    { label: "Successes", value: fmtNum(res.counters.connect_success_total) },
                    { label: "Failures", value: fmtNum(res.counters.connect_fail_total) },
                    {
                      label: "Fail-fast hard errors",
                      value: fmtNum(res.counters.connect_failfast_hard_error_total),
                    },
                  ]}
                />
              </CardContent>
            </Card>

            {!hasRuntimeRows ? (
              <Card>
                <div className="p-2">
                  <RuntimeUnavailable reason={res.reason} />
                </div>
              </Card>
            ) : (
              <>
                {res.summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Upstream summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <StatGrid
                        items={[
                          { label: "Configured", value: fmtNum(res.summary.configured_total) },
                          { label: "Healthy", value: fmtNum(res.summary.healthy_total) },
                          { label: "Unhealthy", value: fmtNum(res.summary.unhealthy_total) },
                          { label: "Direct", value: fmtNum(res.summary.direct_total) },
                          { label: "SOCKS4", value: fmtNum(res.summary.socks4_total) },
                          { label: "SOCKS5", value: fmtNum(res.summary.socks5_total) },
                          { label: "Shadowsocks", value: fmtNum(res.summary.shadowsocks_total) },
                        ]}
                      />
                    </CardContent>
                  </Card>
                )}

                {res.upstreams && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Upstreams</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Kind</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Weight</TableHead>
                            <TableHead>Scopes</TableHead>
                            <TableHead>Healthy</TableHead>
                            <TableHead>Fails</TableHead>
                            <TableHead>Last check</TableHead>
                            <TableHead>Latency</TableHead>
                            <TableHead>Per-DC</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {res.upstreams.map((u) => (
                            <TableRow key={u.upstream_id}>
                              <TableCell>{u.upstream_id}</TableCell>
                              <TableCell className="font-mono text-xs">{u.route_kind}</TableCell>
                              <TableCell className="font-mono text-xs">{u.address}</TableCell>
                              <TableCell>{u.weight}</TableCell>
                              <TableCell className="font-mono text-xs">{u.scopes}</TableCell>
                              <TableCell>
                                <Badge variant={u.healthy ? "outline" : "destructive"}>
                                  {u.healthy ? "healthy" : "unhealthy"}
                                </Badge>
                              </TableCell>
                              <TableCell>{fmtNum(u.fails)}</TableCell>
                              <TableCell className="text-muted-foreground text-xs">
                                {fmtNum(u.last_check_age_secs)}s ago
                              </TableCell>
                              <TableCell>
                                {u.effective_latency_ms != null
                                  ? `${u.effective_latency_ms.toFixed(1)} ms`
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs">
                                {u.dc.length === 0
                                  ? "—"
                                  : u.dc
                                      .map(
                                        (dc) =>
                                          `DC${dc.dc}: ${
                                            dc.latency_ema_ms != null
                                              ? `${dc.latency_ema_ms.toFixed(0)}ms`
                                              : "?"
                                          } (${dc.ip_preference})`,
                                      )
                                      .join(", ")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
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

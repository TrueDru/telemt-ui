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
import { useMePoolStateQuery } from "@/components/runtime/queries";
import { fmtNum, relTime } from "@/lib/format";
import type { TelemtResult } from "@/lib/telemt/client";
import type { RuntimeMePoolStateData } from "@/lib/telemt/schemas/runtime";

export function MePoolStatePanel({
  instanceId,
  initial,
}: {
  instanceId: string;
  initial?: TelemtResult<RuntimeMePoolStateData>;
}) {
  const query = useMePoolStateQuery(instanceId, initial);
  return (
    <RuntimePanel query={query}>
      {(res) => {
        if (!res.enabled || !res.data) return <RuntimeUnavailable reason={res.reason} />;
        const { generations, hardswap, writers, refill } = res.data;
        return (
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Pool generations</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <StatGrid
                  items={[
                    { label: "Active generation", value: fmtNum(generations.active_generation) },
                    { label: "Warm generation", value: fmtNum(generations.warm_generation) },
                    {
                      label: "Pending hardswap generation",
                      value: fmtNum(generations.pending_hardswap_generation),
                    },
                    {
                      label: "Pending hardswap age",
                      value:
                        generations.pending_hardswap_age_secs != null
                          ? `${fmtNum(generations.pending_hardswap_age_secs)}s`
                          : "—",
                    },
                  ]}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground text-xs">Draining generations:</span>
                  {generations.draining_generations.length === 0 ? (
                    <span className="text-muted-foreground text-xs">none</span>
                  ) : (
                    generations.draining_generations.map((g) => (
                      <Badge key={g} variant="outline" className="font-mono">
                        {g}
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-sm">Hardswap</CardTitle>
                <div className="flex gap-2">
                  <Badge variant={hardswap.enabled ? "outline" : "secondary"}>
                    {hardswap.enabled ? "enabled" : "disabled"}
                  </Badge>
                  <Badge variant={hardswap.pending ? "destructive" : "outline"}>
                    {hardswap.pending ? "pending" : "idle"}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Writers</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <StatGrid
                  items={[
                    { label: "Total", value: fmtNum(writers.total) },
                    { label: "Alive (non-draining)", value: fmtNum(writers.alive_non_draining) },
                    { label: "Draining", value: fmtNum(writers.draining) },
                    { label: "Degraded", value: fmtNum(writers.degraded) },
                  ]}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-muted-foreground mb-1.5 text-xs font-medium">Contour</div>
                    <StatGrid
                      items={[
                        { label: "Warm", value: fmtNum(writers.contour.warm) },
                        { label: "Active", value: fmtNum(writers.contour.active) },
                        { label: "Draining", value: fmtNum(writers.contour.draining) },
                      ]}
                    />
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1.5 text-xs font-medium">Health</div>
                    <StatGrid
                      items={[
                        { label: "Healthy", value: fmtNum(writers.health.healthy) },
                        { label: "Degraded", value: fmtNum(writers.health.degraded) },
                        { label: "Draining", value: fmtNum(writers.health.draining) },
                      ]}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">In-flight refill</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <StatGrid
                  items={[
                    {
                      label: "Endpoints in flight",
                      value: fmtNum(refill.inflight_endpoints_total),
                    },
                    { label: "DC+family groups", value: fmtNum(refill.inflight_dc_total) },
                  ]}
                />
                {refill.by_dc.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>DC</TableHead>
                        <TableHead>Family</TableHead>
                        <TableHead>In flight</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {refill.by_dc.map((row, i) => (
                        <TableRow key={`${row.dc}-${row.family}-${i}`}>
                          <TableCell>{row.dc}</TableCell>
                          <TableCell className="font-mono text-xs">{row.family}</TableCell>
                          <TableCell>{fmtNum(row.inflight)}</TableCell>
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

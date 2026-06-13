"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SecurityPanel } from "@/components/security/security-panel";
import { StatGrid } from "@/components/runtime/stat-grid";
import { useSecurityWhitelistQuery } from "@/components/security/queries";
import { fmtNum, relTime } from "@/lib/format";
import type { TelemtResult } from "@/lib/telemt/client";
import type { SecurityWhitelistData } from "@/lib/telemt/schemas/security";

export function WhitelistPanel({
  instanceId,
  initial,
}: {
  instanceId: string;
  initial?: TelemtResult<SecurityWhitelistData>;
}) {
  const query = useSecurityWhitelistQuery(instanceId, initial);
  return (
    <SecurityPanel query={query}>
      {(res) => (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm">IP whitelist</CardTitle>
            <Badge variant={res.enabled ? "outline" : "secondary"}>
              {res.enabled ? "enabled" : "disabled (allow all)"}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <StatGrid items={[{ label: "Entries", value: fmtNum(res.entries_total) }]} />
            <div className="flex flex-col gap-1 font-mono text-xs">
              {res.entries.length === 0 ? (
                <span className="text-muted-foreground">none</span>
              ) : (
                res.entries.map((e) => <span key={e}>{e}</span>)
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              Snapshot generated {relTime(res.generated_at_epoch_secs * 1000)}.
            </p>
          </CardContent>
        </Card>
      )}
    </SecurityPanel>
  );
}

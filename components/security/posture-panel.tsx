"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SecurityPanel } from "@/components/security/security-panel";
import { StatGrid } from "@/components/runtime/stat-grid";
import { useSecurityPostureQuery } from "@/components/security/queries";
import { fmtNum } from "@/lib/format";
import type { TelemtResult } from "@/lib/telemt/client";
import type { SecurityPostureData } from "@/lib/telemt/schemas/security";

function FlagBadge({
  value,
  labels = ["on", "off"],
}: {
  value: boolean;
  labels?: [string, string];
}) {
  return <Badge variant={value ? "outline" : "secondary"}>{value ? labels[0] : labels[1]}</Badge>;
}

export function PosturePanel({
  instanceId,
  initial,
}: {
  instanceId: string;
  initial?: TelemtResult<SecurityPostureData>;
}) {
  const query = useSecurityPostureQuery(instanceId, initial);
  return (
    <SecurityPanel query={query}>
      {(res) => (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">API posture</CardTitle>
            </CardHeader>
            <CardContent>
              <StatGrid
                items={[
                  {
                    label: "Read-only mode",
                    value: (
                      <FlagBadge value={res.api_read_only} labels={["read-only", "read-write"]} />
                    ),
                  },
                  {
                    label: "IP whitelist",
                    value: (
                      <FlagBadge
                        value={res.api_whitelist_enabled}
                        labels={["enabled", "disabled"]}
                      />
                    ),
                  },
                  { label: "Whitelist entries", value: fmtNum(res.api_whitelist_entries) },
                  {
                    label: "Auth header",
                    value: (
                      <FlagBadge
                        value={res.api_auth_header_enabled}
                        labels={["enabled", "disabled"]}
                      />
                    ),
                  },
                  {
                    label: "PROXY protocol",
                    value: (
                      <FlagBadge
                        value={res.proxy_protocol_enabled}
                        labels={["enabled", "disabled"]}
                      />
                    ),
                  },
                  {
                    label: "Log level",
                    value: (
                      <Badge variant="outline" className="font-mono">
                        {res.log_level}
                      </Badge>
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Telemetry</CardTitle>
            </CardHeader>
            <CardContent>
              <StatGrid
                items={[
                  {
                    label: "Core telemetry",
                    value: (
                      <FlagBadge
                        value={res.telemetry_core_enabled}
                        labels={["enabled", "disabled"]}
                      />
                    ),
                  },
                  {
                    label: "Per-user telemetry",
                    value: (
                      <FlagBadge
                        value={res.telemetry_user_enabled}
                        labels={["enabled", "disabled"]}
                      />
                    ),
                  },
                  {
                    label: "ME telemetry level",
                    value: (
                      <Badge variant="outline" className="font-mono">
                        {res.telemetry_me_level}
                      </Badge>
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </SecurityPanel>
  );
}

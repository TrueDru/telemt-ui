"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RuntimePanel } from "@/components/runtime/runtime-panel";
import { RuntimeUnavailable } from "@/components/runtime/runtime-unavailable";
import { StatGrid } from "@/components/runtime/stat-grid";
import { FingerprintTable } from "@/components/fingerprints/fingerprint-table";
import { useTlsFingerprintsQuery } from "@/components/fingerprints/queries";
import { fmtNum, fmtUptime, relTime } from "@/lib/format";
import type { TelemtResult } from "@/lib/telemt/client";
import type { RuntimeTlsFingerprintsData } from "@/lib/telemt/schemas/fingerprints";

const LIMIT_OPTIONS = [10, 25, 50, 100, 200, 500, 1000];

const TABS = [
  { value: "by-fingerprint", label: "By fingerprint" },
  { value: "by-ip", label: "By IP" },
  { value: "by-cidr", label: "By CIDR" },
  { value: "by-user", label: "By user" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export function FingerprintsView({
  instanceId,
  initial,
  defaultLimit,
}: {
  instanceId: string;
  initial?: TelemtResult<RuntimeTlsFingerprintsData>;
  defaultLimit: number;
}) {
  const [limit, setLimit] = useState(defaultLimit);
  const [tab, setTab] = useState<TabValue>("by-fingerprint");
  const query = useTlsFingerprintsQuery(
    instanceId,
    limit,
    limit === defaultLimit ? initial : undefined,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-2">
        <span className="text-muted-foreground text-sm">Top-N limit</span>
        <Select
          value={limit}
          onValueChange={(v) => {
            if (v != null) setLimit(v);
          }}
        >
          <SelectTrigger size="sm" className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LIMIT_OPTIONS.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <RuntimePanel query={query}>
        {(res) => {
          if (!res.enabled || !res.data) return <RuntimeUnavailable reason={res.reason} />;
          const { data } = res;
          return (
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Collector</CardTitle>
                </CardHeader>
                <CardContent>
                  <StatGrid
                    items={[
                      { label: "Effective limit", value: fmtNum(data.limit) },
                      { label: "Retention", value: fmtUptime(data.retention_secs) },
                      { label: "Capacity", value: fmtNum(data.capacity) },
                      { label: "Dropped buckets", value: fmtNum(data.dropped_total) },
                      { label: "Parse errors", value: fmtNum(data.parse_error_total) },
                    ]}
                  />
                </CardContent>
              </Card>

              <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
                <TabsList>
                  {TABS.map((t) => (
                    <TabsTrigger key={t.value} value={t.value}>
                      {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="by-fingerprint" className="pt-3">
                  <FingerprintTable rows={data.by_fingerprint} />
                </TabsContent>
                <TabsContent value="by-ip" className="pt-3">
                  <FingerprintTable rows={data.by_ip} scopeLabel="IP" />
                </TabsContent>
                <TabsContent value="by-cidr" className="pt-3">
                  <FingerprintTable rows={data.by_cidr} scopeLabel="CIDR" />
                </TabsContent>
                <TabsContent value="by-user" className="pt-3">
                  <FingerprintTable rows={data.by_user} scopeLabel="User" />
                </TabsContent>
              </Tabs>

              <p className="text-muted-foreground text-xs">
                Snapshot generated {relTime(res.generated_at_epoch_secs * 1000)}.
              </p>
            </div>
          );
        }}
      </RuntimePanel>
    </div>
  );
}

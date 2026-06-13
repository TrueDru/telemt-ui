"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DcWritersPanel } from "@/components/runtime/dc-writers-panel";
import { MePoolStatePanel } from "@/components/runtime/me-pool-state-panel";
import { MeQualityPanel } from "@/components/runtime/me-quality-panel";
import { MeSelftestPanel } from "@/components/runtime/me-selftest-panel";
import { NatStunPanel } from "@/components/runtime/nat-stun-panel";
import { UpstreamQualityPanel } from "@/components/runtime/upstream-quality-panel";
import type { TelemtResult } from "@/lib/telemt/client";
import type {
  MinimalAllData,
  RuntimeMePoolStateData,
  RuntimeMeQualityData,
  RuntimeMeSelftestData,
  RuntimeNatStunData,
  RuntimeUpstreamQualityData,
} from "@/lib/telemt/schemas/runtime";

const TABS = [
  { value: "me-pool", label: "ME pool state" },
  { value: "me-quality", label: "ME quality" },
  { value: "upstreams", label: "Upstream quality" },
  { value: "nat-stun", label: "NAT/STUN" },
  { value: "me-selftest", label: "ME self-test" },
  { value: "dcs-writers", label: "DC & writers" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export function RuntimeTabs({
  instanceId,
  mePoolState,
  meQuality,
  upstreamQuality,
  natStun,
  meSelftest,
  minimalAll,
}: {
  instanceId: string;
  mePoolState?: TelemtResult<RuntimeMePoolStateData>;
  meQuality?: TelemtResult<RuntimeMeQualityData>;
  upstreamQuality?: TelemtResult<RuntimeUpstreamQualityData>;
  natStun?: TelemtResult<RuntimeNatStunData>;
  meSelftest?: TelemtResult<RuntimeMeSelftestData>;
  minimalAll?: TelemtResult<MinimalAllData>;
}) {
  const [tab, setTab] = useState<TabValue>("me-pool");

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
      <TabsList>
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="me-pool" className="pt-3">
        <MePoolStatePanel instanceId={instanceId} initial={mePoolState} />
      </TabsContent>
      <TabsContent value="me-quality" className="pt-3">
        <MeQualityPanel instanceId={instanceId} initial={meQuality} />
      </TabsContent>
      <TabsContent value="upstreams" className="pt-3">
        <UpstreamQualityPanel instanceId={instanceId} initial={upstreamQuality} />
      </TabsContent>
      <TabsContent value="nat-stun" className="pt-3">
        <NatStunPanel instanceId={instanceId} initial={natStun} />
      </TabsContent>
      <TabsContent value="me-selftest" className="pt-3">
        <MeSelftestPanel instanceId={instanceId} initial={meSelftest} />
      </TabsContent>
      <TabsContent value="dcs-writers" className="pt-3">
        <DcWritersPanel instanceId={instanceId} initial={minimalAll} />
      </TabsContent>
    </Tabs>
  );
}

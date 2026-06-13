import { RuntimeTabs } from "@/components/runtime/runtime-tabs";
import { getCurrentInstance } from "@/lib/instance";
import { telemt, type TelemtResult } from "@/lib/telemt/client";

async function safe<T>(p: Promise<TelemtResult<T>>): Promise<TelemtResult<T> | undefined> {
  try {
    return await p;
  } catch {
    return undefined;
  }
}

export default async function RuntimePage() {
  const current = await getCurrentInstance();

  const [mePoolState, meQuality, upstreamQuality, natStun, meSelftest, minimalAll] =
    await Promise.all([
      safe(telemt.runtimeMePoolState(current.id)),
      safe(telemt.runtimeMeQuality(current.id)),
      safe(telemt.runtimeUpstreamQuality(current.id)),
      safe(telemt.runtimeNatStun(current.id)),
      safe(telemt.runtimeMeSelftest(current.id)),
      safe(telemt.statsMinimalAll(current.id)),
    ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Runtime</h1>
        <p className="text-muted-foreground text-sm">
          Live ME pool, quality, upstream, NAT/STUN, and self-test diagnostics for {current.label}.
        </p>
      </div>
      <RuntimeTabs
        instanceId={current.id}
        mePoolState={mePoolState}
        meQuality={meQuality}
        upstreamQuality={upstreamQuality}
        natStun={natStun}
        meSelftest={meSelftest}
        minimalAll={minimalAll}
      />
    </div>
  );
}

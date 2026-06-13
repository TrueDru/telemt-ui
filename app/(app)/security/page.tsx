import { PosturePanel } from "@/components/security/posture-panel";
import { WhitelistPanel } from "@/components/security/whitelist-panel";
import { getCurrentInstance } from "@/lib/instance";
import { telemt, type TelemtResult } from "@/lib/telemt/client";

async function safe<T>(p: Promise<TelemtResult<T>>): Promise<TelemtResult<T> | undefined> {
  try {
    return await p;
  } catch {
    return undefined;
  }
}

export default async function SecurityPage() {
  const current = await getCurrentInstance();

  const [posture, whitelist] = await Promise.all([
    safe(telemt.securityPosture(current.id)),
    safe(telemt.securityWhitelist(current.id)),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Security</h1>
        <p className="text-muted-foreground text-sm">
          API posture flags and IP whitelist for {current.label}.
        </p>
      </div>
      <PosturePanel instanceId={current.id} initial={posture} />
      <WhitelistPanel instanceId={current.id} initial={whitelist} />
    </div>
  );
}

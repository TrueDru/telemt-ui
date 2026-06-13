import { FingerprintsView } from "@/components/fingerprints/fingerprints-view";
import { getCurrentInstance } from "@/lib/instance";
import { telemt, type TelemtResult } from "@/lib/telemt/client";
import type { RuntimeTlsFingerprintsData } from "@/lib/telemt/schemas/fingerprints";

const DEFAULT_LIMIT = 50;

async function safe<T>(p: Promise<TelemtResult<T>>): Promise<TelemtResult<T> | undefined> {
  try {
    return await p;
  } catch {
    return undefined;
  }
}

export default async function FingerprintsPage() {
  const current = await getCurrentInstance();
  const initial = await safe<RuntimeTlsFingerprintsData>(
    telemt.runtimeTlsFingerprints(current.id, DEFAULT_LIMIT),
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Fingerprints</h1>
        <p className="text-muted-foreground text-sm">
          JA3/JA4 TLS ClientHello leaderboards for {current.label}.
        </p>
      </div>
      <FingerprintsView instanceId={current.id} initial={initial} defaultLimit={DEFAULT_LIMIT} />
    </div>
  );
}

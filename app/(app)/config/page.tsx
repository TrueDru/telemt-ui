import { getCurrentInstance } from "@/lib/instance";
import { telemt, type TelemtResult } from "@/lib/telemt/client";
import { ConfigEditor } from "@/components/config/config-editor";
import type { ConfigData } from "@/lib/telemt/schemas/config";

async function safe<T>(p: Promise<TelemtResult<T>>): Promise<TelemtResult<T> | null> {
  try {
    return await p;
  } catch {
    return null;
  }
}

export default async function ConfigPage() {
  const current = await getCurrentInstance();
  const config = await safe<ConfigData>(telemt.config.get(current.id));
  return <ConfigEditor instanceId={current.id} initial={config} />;
}

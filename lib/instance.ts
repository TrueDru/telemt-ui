import { cookies } from "next/headers";
import { getEnv, type TelemtInstance } from "@/lib/env";

export const INSTANCE_COOKIE = "telemt_instance";

/** Selected instance, from cookie set by `setInstance` (lib/auth/actions.ts), defaulting to the first configured one. */
export async function getCurrentInstance(): Promise<TelemtInstance> {
  const { instances } = getEnv();
  const id = (await cookies()).get(INSTANCE_COOKIE)?.value;
  return instances.find((i) => i.id === id) ?? instances[0];
}

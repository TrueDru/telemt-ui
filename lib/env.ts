import { z } from "zod";

const instanceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  baseUrl: z.url(),
  authHeader: z.string().min(1),
});

export type TelemtInstance = z.infer<typeof instanceSchema>;

const appPasswordSchema = z.string().min(8, "APP_PASSWORD must be at least 8 characters");

const INSTANCE_ID_RE = /^TELEMT_([A-Z0-9_]+)_BASE_URL$/;

function loadInstances(processEnv: NodeJS.ProcessEnv): TelemtInstance[] {
  const ids = new Set<string>();
  for (const key of Object.keys(processEnv)) {
    const match = key.match(INSTANCE_ID_RE);
    if (match) ids.add(match[1]);
  }

  const instances: TelemtInstance[] = [];
  for (const id of ids) {
    const parsed = instanceSchema.safeParse({
      id: id.toLowerCase().replace(/_/g, "-"),
      label: processEnv[`TELEMT_${id}_LABEL`] ?? id,
      baseUrl: processEnv[`TELEMT_${id}_BASE_URL`],
      authHeader: processEnv[`TELEMT_${id}_AUTH_HEADER`],
    });
    if (!parsed.success) {
      throw new Error(`Invalid config for telemt instance "${id}": ${parsed.error.message}`);
    }
    instances.push(parsed.data);
  }

  if (instances.length === 0) {
    throw new Error(
      "No telemt instances configured. Set TELEMT_<ID>_BASE_URL and TELEMT_<ID>_AUTH_HEADER " +
        "for at least one instance (optionally TELEMT_<ID>_LABEL).",
    );
  }
  return instances;
}

export interface Env {
  appPassword: string;
  instances: TelemtInstance[];
}

let cached: Env | undefined;

export function getEnv(): Env {
  if (cached) return cached;

  const appPassword = appPasswordSchema.safeParse(process.env.APP_PASSWORD);
  if (!appPassword.success) {
    throw new Error(`Invalid APP_PASSWORD: ${appPassword.error.message}`);
  }

  cached = {
    appPassword: appPassword.data,
    instances: loadInstances(process.env),
  };
  return cached;
}

export function getInstance(id: string): TelemtInstance {
  const instance = getEnv().instances.find((i) => i.id === id);
  if (!instance) {
    throw new Error(`Unknown telemt instance: ${id}`);
  }
  return instance;
}

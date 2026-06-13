import { z } from "zod";
import { getInstance } from "@/lib/env";
import { errorEnvelopeSchema, successEnvelope } from "./schemas/common";
import {
  healthDataSchema,
  healthReadyDataSchema,
  runtimeGatesDataSchema,
  summaryDataSchema,
  systemInfoDataSchema,
} from "./schemas/system";
import {
  configDataSchema,
  patchConfigResponseSchema,
  type PatchConfigRequest,
} from "./schemas/config";
import {
  createUserResponseSchema,
  deleteUserResponseSchema,
  resetUserQuotaResponseSchema,
  userInfoSchema,
  type CreateUserRequest,
  type PatchUserRequest,
  type RotateSecretRequest,
} from "./schemas/users";
import { TelemtApiError, TelemtClientError } from "./errors";

export interface TelemtResult<T> {
  data: T;
  revision: string;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  ifMatch?: string;
  query?: Record<string, string | number | undefined>;
}

/**
 * Low-level call against one telemt instance's Control API. Injects the
 * instance's `Authorization` header, parses the `{ok,data,revision}` /
 * `{ok:false,error,request_id}` envelope, and validates `data` against
 * `schema`.
 */
export async function telemtRequest<T>(
  instanceId: string,
  path: string,
  schema: z.ZodType<T>,
  opts: RequestOptions = {},
): Promise<TelemtResult<T>> {
  const instance = getInstance(instanceId);
  const url = new URL(path, instance.baseUrl);
  if (opts.query) {
    for (const [key, value] of Object.entries(opts.query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = { Authorization: instance.authHeader };
  let body: string | undefined;
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  if (opts.ifMatch) headers["If-Match"] = opts.ifMatch;

  let res: Response;
  try {
    res = await fetch(url, { method: opts.method ?? "GET", headers, body, cache: "no-store" });
  } catch (err) {
    throw new TelemtClientError(
      `Couldn't reach telemt instance "${instance.label}": ${(err as Error).message}`,
    );
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new TelemtClientError(
      `Instance "${instance.label}" returned a non-JSON response (HTTP ${res.status}).`,
    );
  }

  if (!res.ok) {
    const parsed = errorEnvelopeSchema.safeParse(json);
    if (parsed.success) {
      const { error, request_id } = parsed.data;
      throw new TelemtApiError(res.status, error.code, error.message, request_id);
    }
    throw new TelemtClientError(`Instance "${instance.label}" returned HTTP ${res.status}.`);
  }

  const parsed = successEnvelope(schema).safeParse(json);
  if (!parsed.success) {
    throw new TelemtClientError(
      `Unexpected response shape from "${instance.label}" for ${path}: ${parsed.error.message}`,
    );
  }
  return { data: parsed.data.data, revision: parsed.data.revision };
}

const userPath = (username: string) => `/v1/users/${encodeURIComponent(username)}`;

/** Typed wrappers for the Control API endpoints used by the UI. */
export const telemt = {
  health: (instanceId: string) => telemtRequest(instanceId, "/v1/health", healthDataSchema),
  healthReady: (instanceId: string) =>
    telemtRequest(instanceId, "/v1/health/ready", healthReadyDataSchema),
  systemInfo: (instanceId: string) =>
    telemtRequest(instanceId, "/v1/system/info", systemInfoDataSchema),
  runtimeGates: (instanceId: string) =>
    telemtRequest(instanceId, "/v1/runtime/gates", runtimeGatesDataSchema),
  summary: (instanceId: string) =>
    telemtRequest(instanceId, "/v1/stats/summary", summaryDataSchema),

  config: {
    get: (instanceId: string) => telemtRequest(instanceId, "/v1/config", configDataSchema),
    patch: (instanceId: string, body: PatchConfigRequest, ifMatch?: string) =>
      telemtRequest(instanceId, "/v1/config", patchConfigResponseSchema, {
        method: "PATCH",
        body,
        ifMatch,
      }),
  },

  users: {
    list: (instanceId: string) => telemtRequest(instanceId, "/v1/users", z.array(userInfoSchema)),
    get: (instanceId: string, username: string) =>
      telemtRequest(instanceId, userPath(username), userInfoSchema),
    create: (instanceId: string, body: CreateUserRequest) =>
      telemtRequest(instanceId, "/v1/users", createUserResponseSchema, { method: "POST", body }),
    patch: (instanceId: string, username: string, body: PatchUserRequest, ifMatch?: string) =>
      telemtRequest(instanceId, userPath(username), userInfoSchema, {
        method: "PATCH",
        body,
        ifMatch,
      }),
    delete: (instanceId: string, username: string) =>
      telemtRequest(instanceId, userPath(username), deleteUserResponseSchema, {
        method: "DELETE",
      }),
    rotateSecret: (instanceId: string, username: string, body?: RotateSecretRequest) =>
      telemtRequest(instanceId, `${userPath(username)}/rotate-secret`, createUserResponseSchema, {
        method: "POST",
        body: body ?? {},
      }),
    enable: (instanceId: string, username: string) =>
      telemtRequest(instanceId, `${userPath(username)}/enable`, userInfoSchema, {
        method: "POST",
        body: {},
      }),
    disable: (instanceId: string, username: string) =>
      telemtRequest(instanceId, `${userPath(username)}/disable`, userInfoSchema, {
        method: "POST",
        body: {},
      }),
    resetQuota: (instanceId: string, username: string) =>
      telemtRequest(instanceId, `${userPath(username)}/reset-quota`, resetUserQuotaResponseSchema, {
        method: "POST",
        body: {},
      }),
  },
};

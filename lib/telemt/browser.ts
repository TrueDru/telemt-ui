import { z } from "zod";
import { errorEnvelopeSchema, successEnvelope } from "./schemas/common";
import { TelemtApiError, TelemtClientError } from "./errors";
import type { TelemtResult } from "./client";

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  ifMatch?: string;
  query?: Record<string, string | number | undefined>;
}

/**
 * Browser-side call against `/api/telemt/<path>?instance=<id>` (the BFF
 * proxy). Mirrors `telemtRequest` in `client.ts` but runs client-side and
 * never sees the instance's `Authorization` header.
 */
export async function apiRequest<T>(
  instanceId: string,
  path: string,
  schema: z.ZodType<T>,
  opts: RequestOptions = {},
): Promise<TelemtResult<T>> {
  const url = new URL(`/api/telemt${path}`, window.location.origin);
  url.searchParams.set("instance", instanceId);
  if (opts.query) {
    for (const [key, value] of Object.entries(opts.query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = {};
  if (opts.ifMatch) headers["If-Match"] = opts.ifMatch;
  let body: string | undefined;
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(url, { method: opts.method ?? "GET", headers, body });
  } catch (err) {
    throw new TelemtClientError(`Network error: ${(err as Error).message}`);
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new TelemtClientError(`Unexpected response (HTTP ${res.status}).`);
  }

  if (!res.ok) {
    const parsed = errorEnvelopeSchema.safeParse(json);
    if (parsed.success) {
      const { error, request_id } = parsed.data;
      throw new TelemtApiError(res.status, error.code, error.message, request_id);
    }
    throw new TelemtClientError(`Request failed (HTTP ${res.status}).`);
  }

  const parsed = successEnvelope(schema).safeParse(json);
  if (!parsed.success) {
    throw new TelemtClientError(`Unexpected response shape: ${parsed.error.message}`);
  }
  return { data: parsed.data.data, revision: parsed.data.revision };
}

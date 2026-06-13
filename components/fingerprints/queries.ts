import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/telemt/browser";
import { errorMessage, TelemtApiError } from "@/lib/telemt/errors";
import {
  runtimeTlsFingerprintsDataSchema,
  type RuntimeTlsFingerprintsData,
} from "@/lib/telemt/schemas/fingerprints";
import type { TelemtResult } from "@/lib/telemt/client";

export function describeError(err: unknown): string {
  if (err instanceof TelemtApiError) return errorMessage(err.code, err.message);
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

/** Fingerprint leaderboards change quickly; refetch every 15s. */
const REFRESH_MS = 15_000;

export function useTlsFingerprintsQuery(
  instanceId: string,
  limit: number,
  initialData?: TelemtResult<RuntimeTlsFingerprintsData>,
) {
  return useQuery({
    queryKey: ["fingerprints", "tls", instanceId, limit],
    queryFn: () =>
      apiRequest(instanceId, "/runtime/tls-fingerprints", runtimeTlsFingerprintsDataSchema, {
        query: { limit },
      }),
    initialData,
    refetchInterval: REFRESH_MS,
  });
}

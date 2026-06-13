import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/telemt/browser";
import { errorMessage, TelemtApiError } from "@/lib/telemt/errors";
import {
  securityPostureDataSchema,
  securityWhitelistDataSchema,
  type SecurityPostureData,
  type SecurityWhitelistData,
} from "@/lib/telemt/schemas/security";
import type { TelemtResult } from "@/lib/telemt/client";

export function describeError(err: unknown): string {
  if (err instanceof TelemtApiError) return errorMessage(err.code, err.message);
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

/** Security posture/whitelist change rarely; refetch every 30s. */
const REFRESH_MS = 30_000;

export function useSecurityPostureQuery(
  instanceId: string,
  initialData?: TelemtResult<SecurityPostureData>,
) {
  return useQuery({
    queryKey: ["security", "posture", instanceId],
    queryFn: () => apiRequest(instanceId, "/security/posture", securityPostureDataSchema),
    initialData,
    refetchInterval: REFRESH_MS,
  });
}

export function useSecurityWhitelistQuery(
  instanceId: string,
  initialData?: TelemtResult<SecurityWhitelistData>,
) {
  return useQuery({
    queryKey: ["security", "whitelist", instanceId],
    queryFn: () => apiRequest(instanceId, "/security/whitelist", securityWhitelistDataSchema),
    initialData,
    refetchInterval: REFRESH_MS,
  });
}

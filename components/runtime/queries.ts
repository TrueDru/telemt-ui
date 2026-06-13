import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/telemt/browser";
import { errorMessage, TelemtApiError } from "@/lib/telemt/errors";
import {
  minimalAllDataSchema,
  runtimeMePoolStateDataSchema,
  runtimeMeQualityDataSchema,
  runtimeMeSelftestDataSchema,
  runtimeNatStunDataSchema,
  runtimeUpstreamQualityDataSchema,
  type MinimalAllData,
  type RuntimeMePoolStateData,
  type RuntimeMeQualityData,
  type RuntimeMeSelftestData,
  type RuntimeNatStunData,
  type RuntimeUpstreamQualityData,
} from "@/lib/telemt/schemas/runtime";
import type { TelemtResult } from "@/lib/telemt/client";

export function describeError(err: unknown): string {
  if (err instanceof TelemtApiError) return errorMessage(err.code, err.message);
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

/** Diagnostics snapshots are cheap to recompute and change quickly; refetch every 15s. */
const REFRESH_MS = 15_000;

export function useMePoolStateQuery(
  instanceId: string,
  initialData?: TelemtResult<RuntimeMePoolStateData>,
) {
  return useQuery({
    queryKey: ["runtime", "me-pool-state", instanceId],
    queryFn: () => apiRequest(instanceId, "/runtime/me_pool_state", runtimeMePoolStateDataSchema),
    initialData,
    refetchInterval: REFRESH_MS,
  });
}

export function useMeQualityQuery(
  instanceId: string,
  initialData?: TelemtResult<RuntimeMeQualityData>,
) {
  return useQuery({
    queryKey: ["runtime", "me-quality", instanceId],
    queryFn: () => apiRequest(instanceId, "/runtime/me_quality", runtimeMeQualityDataSchema),
    initialData,
    refetchInterval: REFRESH_MS,
  });
}

export function useUpstreamQualityQuery(
  instanceId: string,
  initialData?: TelemtResult<RuntimeUpstreamQualityData>,
) {
  return useQuery({
    queryKey: ["runtime", "upstream-quality", instanceId],
    queryFn: () =>
      apiRequest(instanceId, "/runtime/upstream_quality", runtimeUpstreamQualityDataSchema),
    initialData,
    refetchInterval: REFRESH_MS,
  });
}

export function useNatStunQuery(
  instanceId: string,
  initialData?: TelemtResult<RuntimeNatStunData>,
) {
  return useQuery({
    queryKey: ["runtime", "nat-stun", instanceId],
    queryFn: () => apiRequest(instanceId, "/runtime/nat_stun", runtimeNatStunDataSchema),
    initialData,
    refetchInterval: REFRESH_MS,
  });
}

export function useMeSelftestQuery(
  instanceId: string,
  initialData?: TelemtResult<RuntimeMeSelftestData>,
) {
  return useQuery({
    queryKey: ["runtime", "me-selftest", instanceId],
    queryFn: () => apiRequest(instanceId, "/runtime/me-selftest", runtimeMeSelftestDataSchema),
    initialData,
    refetchInterval: REFRESH_MS,
  });
}

export function useMinimalAllQuery(instanceId: string, initialData?: TelemtResult<MinimalAllData>) {
  return useQuery({
    queryKey: ["runtime", "minimal-all", instanceId],
    queryFn: () => apiRequest(instanceId, "/stats/minimal/all", minimalAllDataSchema),
    initialData,
    refetchInterval: REFRESH_MS,
  });
}

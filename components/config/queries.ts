import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/telemt/browser";
import { errorMessage, TelemtApiError } from "@/lib/telemt/errors";
import {
  configDataSchema,
  patchConfigResponseSchema,
  type ConfigData,
  type PatchConfigRequest,
} from "@/lib/telemt/schemas/config";
import type { TelemtResult } from "@/lib/telemt/client";

export function describeError(err: unknown): string {
  if (err instanceof TelemtApiError) return errorMessage(err.code, err.message);
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

export function useConfigQuery(instanceId: string, initialData?: TelemtResult<ConfigData>) {
  return useQuery({
    queryKey: ["config", instanceId],
    queryFn: () => apiRequest(instanceId, "/config", configDataSchema),
    initialData,
    staleTime: Infinity,
  });
}

export function usePatchConfig(instanceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ body, ifMatch }: { body: PatchConfigRequest; ifMatch: string }) =>
      apiRequest(instanceId, "/config", patchConfigResponseSchema, {
        method: "PATCH",
        body,
        ifMatch,
      }),
    onSuccess: (res, { body }) => {
      queryClient.setQueryData(["config", instanceId], (prev?: TelemtResult<ConfigData>) => ({
        data: { ...prev?.data, ...body },
        revision: res.data.revision,
      }));
    },
  });
}

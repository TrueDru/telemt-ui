import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/telemt/browser";
import { errorMessage, TelemtApiError } from "@/lib/telemt/errors";
import {
  createUserResponseSchema,
  deleteUserResponseSchema,
  resetUserQuotaResponseSchema,
  userInfoSchema,
  type CreateUserRequest,
  type PatchUserRequest,
  type UserInfo,
} from "@/lib/telemt/schemas/users";

const userPath = (username: string) => `/users/${encodeURIComponent(username)}`;

export function describeError(err: unknown): string {
  if (err instanceof TelemtApiError) return errorMessage(err.code, err.message);
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

export function useUsersQuery(instanceId: string, initialData?: UserInfo[]) {
  return useQuery({
    queryKey: ["users", instanceId],
    queryFn: () => apiRequest(instanceId, "/users", z.array(userInfoSchema)).then((r) => r.data),
    initialData,
    refetchInterval: 15_000,
  });
}

export function useSetUserEnabled(instanceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ username, enabled }: { username: string; enabled: boolean }) =>
      apiRequest(
        instanceId,
        `${userPath(username)}/${enabled ? "enable" : "disable"}`,
        userInfoSchema,
        { method: "POST", body: {} },
      ),
    onSuccess: (_data, { username, enabled }) => {
      queryClient.invalidateQueries({ queryKey: ["users", instanceId] });
      toast.success(`${enabled ? "Enabled" : "Disabled"} ${username}`);
    },
    onError: (err) => toast.error(describeError(err)),
  });
}

export function useResetUserQuota(instanceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (username: string) =>
      apiRequest(instanceId, `${userPath(username)}/reset-quota`, resetUserQuotaResponseSchema, {
        method: "POST",
        body: {},
      }),
    onSuccess: (_data, username) => {
      queryClient.invalidateQueries({ queryKey: ["users", instanceId] });
      toast.success(`Quota reset for ${username}`);
    },
    onError: (err) => toast.error(describeError(err)),
  });
}

export function useRotateUserSecret(instanceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (username: string) =>
      apiRequest(instanceId, `${userPath(username)}/rotate-secret`, createUserResponseSchema, {
        method: "POST",
        body: {},
      }),
    onSuccess: (_data, username) => {
      queryClient.invalidateQueries({ queryKey: ["users", instanceId] });
      toast.success(`Secret rotated for ${username}`);
    },
    onError: (err) => toast.error(describeError(err)),
  });
}

export function useDeleteUser(instanceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (username: string) =>
      apiRequest(instanceId, userPath(username), deleteUserResponseSchema, { method: "DELETE" }),
    onSuccess: (_data, username) => {
      queryClient.invalidateQueries({ queryKey: ["users", instanceId] });
      toast.success(`Deleted ${username}`);
    },
    onError: (err) => toast.error(describeError(err)),
  });
}

export function useCreateUser(instanceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUserRequest) =>
      apiRequest(instanceId, "/users", createUserResponseSchema, { method: "POST", body }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["users", instanceId] });
      toast.success(`Created user ${res.data.user.username}`);
    },
    onError: (err) => toast.error(describeError(err)),
  });
}

export function usePatchUser(instanceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ username, body }: { username: string; body: PatchUserRequest }) =>
      apiRequest(instanceId, userPath(username), userInfoSchema, { method: "PATCH", body }),
    onSuccess: (_data, { username }) => {
      queryClient.invalidateQueries({ queryKey: ["users", instanceId] });
      toast.success(`Saved ${username}`);
    },
    onError: (err) => toast.error(describeError(err)),
  });
}

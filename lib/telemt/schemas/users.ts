import { z } from "zod";

/** `[A-Za-z0-9_.-]`, length 1..64 */
export const USERNAME_RE = /^[A-Za-z0-9_.-]{1,64}$/;
/** exactly 32 hex chars */
export const HEX32_RE = /^[0-9a-fA-F]{32}$/;

export const usernameSchema = z.string().regex(USERNAME_RE, "1-64 chars of [A-Za-z0-9_.-]");
export const hex32Schema = z.string().regex(HEX32_RE, "exactly 32 hex chars");

// ---- Response contracts ----------------------------------------------------

export const tlsDomainLinkSchema = z.object({
  domain: z.string(),
  link: z.string(),
});
export type TlsDomainLink = z.infer<typeof tlsDomainLinkSchema>;

export const userLinksSchema = z.object({
  classic: z.array(z.string()),
  secure: z.array(z.string()),
  tls: z.array(z.string()),
  tls_domains: z.array(tlsDomainLinkSchema),
});
export type UserLinks = z.infer<typeof userLinksSchema>;

export const userInfoSchema = z.object({
  username: z.string(),
  enabled: z.boolean(),
  in_runtime: z.boolean(),
  user_ad_tag: z.string().nullish(),
  max_tcp_conns: z.number().nullish(),
  expiration_rfc3339: z.string().nullish(),
  data_quota_bytes: z.number().nullish(),
  rate_limit_up_bps: z.number().nullish(),
  rate_limit_down_bps: z.number().nullish(),
  max_unique_ips: z.number().nullish(),
  current_connections: z.number(),
  active_unique_ips: z.number(),
  active_unique_ips_list: z.array(z.string()),
  recent_unique_ips: z.number(),
  recent_unique_ips_list: z.array(z.string()),
  total_octets: z.number(),
  links: userLinksSchema,
});
export type UserInfo = z.infer<typeof userInfoSchema>;

export const userActiveIpsSchema = z.object({
  username: z.string(),
  active_ips: z.array(z.string()),
});
export type UserActiveIps = z.infer<typeof userActiveIpsSchema>;

export const createUserResponseSchema = z.object({
  user: userInfoSchema,
  secret: z.string(),
});
export type CreateUserResponse = z.infer<typeof createUserResponseSchema>;

export const deleteUserResponseSchema = z.object({
  username: z.string(),
  in_runtime: z.boolean(),
});
export type DeleteUserResponse = z.infer<typeof deleteUserResponseSchema>;

export const resetUserQuotaResponseSchema = z.object({
  username: z.string(),
  used_bytes: z.number(),
  last_reset_epoch_secs: z.number(),
});
export type ResetUserQuotaResponse = z.infer<typeof resetUserQuotaResponseSchema>;

// ---- Request contracts ------------------------------------------------------

export const createUserRequestSchema = z.object({
  username: usernameSchema,
  secret: hex32Schema.optional(),
  user_ad_tag: hex32Schema.optional(),
  max_tcp_conns: z.number().int().nonnegative().optional(),
  expiration_rfc3339: z.string().optional(),
  data_quota_bytes: z.number().int().nonnegative().optional(),
  rate_limit_up_bps: z.number().int().nonnegative().optional(),
  rate_limit_down_bps: z.number().int().nonnegative().optional(),
  max_unique_ips: z.number().int().nonnegative().optional(),
  enabled: z.boolean().optional(),
});
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

/**
 * JSON Merge Patch semantics: omitted = unchanged, `null` = clear the
 * per-user override, non-null = set.
 */
export const patchUserRequestSchema = z.object({
  secret: hex32Schema.optional(),
  user_ad_tag: hex32Schema.nullable().optional(),
  max_tcp_conns: z.number().int().nonnegative().nullable().optional(),
  expiration_rfc3339: z.string().nullable().optional(),
  data_quota_bytes: z.number().int().nonnegative().nullable().optional(),
  rate_limit_up_bps: z.number().int().nonnegative().nullable().optional(),
  rate_limit_down_bps: z.number().int().nonnegative().nullable().optional(),
  max_unique_ips: z.number().int().nonnegative().nullable().optional(),
  enabled: z.boolean().nullable().optional(),
});
export type PatchUserRequest = z.infer<typeof patchUserRequestSchema>;

export const rotateSecretRequestSchema = z.object({
  secret: hex32Schema.optional(),
});
export type RotateSecretRequest = z.infer<typeof rotateSecretRequestSchema>;

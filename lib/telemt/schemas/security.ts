import { z } from "zod";

export const securityPostureDataSchema = z.object({
  api_read_only: z.boolean(),
  api_whitelist_enabled: z.boolean(),
  api_whitelist_entries: z.number(),
  api_auth_header_enabled: z.boolean(),
  proxy_protocol_enabled: z.boolean(),
  log_level: z.string(),
  telemetry_core_enabled: z.boolean(),
  telemetry_user_enabled: z.boolean(),
  telemetry_me_level: z.string(),
});
export type SecurityPostureData = z.infer<typeof securityPostureDataSchema>;

export const securityWhitelistDataSchema = z.object({
  generated_at_epoch_secs: z.number(),
  enabled: z.boolean(),
  entries_total: z.number(),
  entries: z.array(z.string()),
});
export type SecurityWhitelistData = z.infer<typeof securityWhitelistDataSchema>;

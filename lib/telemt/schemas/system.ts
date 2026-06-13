import { z } from "zod";
import { classCountSchema } from "./common";

export const healthDataSchema = z.object({
  status: z.string(),
  read_only: z.boolean(),
});
export type HealthData = z.infer<typeof healthDataSchema>;

export const healthReadyDataSchema = z.object({
  ready: z.boolean(),
  status: z.string(),
  reason: z.string().nullish(),
  admission_open: z.boolean(),
  healthy_upstreams: z.number(),
  total_upstreams: z.number(),
});
export type HealthReadyData = z.infer<typeof healthReadyDataSchema>;

export const summaryDataSchema = z.object({
  uptime_seconds: z.number(),
  connections_total: z.number(),
  connections_bad_total: z.number(),
  connections_bad_by_class: z.array(classCountSchema),
  handshake_failures_by_class: z.array(classCountSchema),
  handshake_timeouts_total: z.number(),
  configured_users: z.number(),
});
export type SummaryData = z.infer<typeof summaryDataSchema>;

export const systemInfoDataSchema = z.object({
  version: z.string(),
  target_arch: z.string(),
  target_os: z.string(),
  build_profile: z.string(),
  git_commit: z.string().nullish(),
  build_time_utc: z.string().nullish(),
  rustc_version: z.string().nullish(),
  process_started_at_epoch_secs: z.number(),
  uptime_seconds: z.number(),
  config_path: z.string(),
  config_hash: z.string(),
  config_reload_count: z.number(),
  last_config_reload_epoch_secs: z.number().nullish(),
});
export type SystemInfoData = z.infer<typeof systemInfoDataSchema>;

export const apiEventRecordSchema = z.object({
  seq: z.number(),
  ts_epoch_secs: z.number(),
  event_type: z.string(),
  context: z.string(),
});
export type ApiEventRecord = z.infer<typeof apiEventRecordSchema>;

export const runtimeEdgeEventsDataSchema = z.object({
  enabled: z.boolean(),
  reason: z.string().nullish(),
  generated_at_epoch_secs: z.number(),
  data: z
    .object({
      capacity: z.number(),
      dropped_total: z.number(),
      events: z.array(apiEventRecordSchema),
    })
    .nullable(),
});
export type RuntimeEdgeEventsData = z.infer<typeof runtimeEdgeEventsDataSchema>;

export const runtimeGatesDataSchema = z.object({
  accepting_new_connections: z.boolean(),
  conditional_cast_enabled: z.boolean(),
  me_runtime_ready: z.boolean(),
  me2dc_fallback_enabled: z.boolean(),
  me2dc_fast_enabled: z.boolean(),
  use_middle_proxy: z.boolean(),
  route_mode: z.string(),
  reroute_active: z.boolean(),
  reroute_to_direct_at_epoch_secs: z.number().nullish(),
  reroute_reason: z.string().nullish(),
  startup_status: z.string(),
  startup_stage: z.string(),
  startup_progress_pct: z.number(),
});
export type RuntimeGatesData = z.infer<typeof runtimeGatesDataSchema>;

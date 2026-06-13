import { z } from "zod";

// ---------------------------------------------------------------------------
// RuntimeMePoolStateData — GET /v1/runtime/me_pool_state
// ---------------------------------------------------------------------------

const mePoolStateGenerationSchema = z.object({
  active_generation: z.number(),
  warm_generation: z.number(),
  pending_hardswap_generation: z.number(),
  pending_hardswap_age_secs: z.number().nullish(),
  draining_generations: z.array(z.number()),
});

const mePoolStateHardswapSchema = z.object({
  enabled: z.boolean(),
  pending: z.boolean(),
});

const mePoolStateWriterContourSchema = z.object({
  warm: z.number(),
  active: z.number(),
  draining: z.number(),
});

const mePoolStateWriterHealthSchema = z.object({
  healthy: z.number(),
  degraded: z.number(),
  draining: z.number(),
});

const mePoolStateWriterSchema = z.object({
  total: z.number(),
  alive_non_draining: z.number(),
  draining: z.number(),
  degraded: z.number(),
  contour: mePoolStateWriterContourSchema,
  health: mePoolStateWriterHealthSchema,
});

const mePoolStateRefillDcSchema = z.object({
  dc: z.number(),
  family: z.string(),
  inflight: z.number(),
});

const mePoolStateRefillSchema = z.object({
  inflight_endpoints_total: z.number(),
  inflight_dc_total: z.number(),
  by_dc: z.array(mePoolStateRefillDcSchema),
});

export const runtimeMePoolStateDataSchema = z.object({
  enabled: z.boolean(),
  reason: z.string().nullish(),
  generated_at_epoch_secs: z.number(),
  data: z
    .object({
      generations: mePoolStateGenerationSchema,
      hardswap: mePoolStateHardswapSchema,
      writers: mePoolStateWriterSchema,
      refill: mePoolStateRefillSchema,
    })
    .nullable(),
});
export type RuntimeMePoolStateData = z.infer<typeof runtimeMePoolStateDataSchema>;

// ---------------------------------------------------------------------------
// RuntimeMeQualityData — GET /v1/runtime/me_quality
// ---------------------------------------------------------------------------

const meQualityCountersSchema = z.object({
  idle_close_by_peer_total: z.number(),
  reader_eof_total: z.number(),
  kdf_drift_total: z.number(),
  kdf_port_only_drift_total: z.number(),
  reconnect_attempt_total: z.number(),
  reconnect_success_total: z.number(),
});

const meQualityRouteDropSchema = z.object({
  no_conn_total: z.number(),
  channel_closed_total: z.number(),
  queue_full_total: z.number(),
  queue_full_base_total: z.number(),
  queue_full_high_total: z.number(),
});

const meQualityFamilyStateSchema = z.object({
  family: z.string(),
  state: z.string(),
  state_since_epoch_secs: z.number(),
  suppressed_until_epoch_secs: z.number().nullish(),
  fail_streak: z.number(),
  recover_success_streak: z.number(),
});

const meQualityDrainGateSchema = z.object({
  route_quorum_ok: z.boolean(),
  redundancy_ok: z.boolean(),
  block_reason: z.string(),
  updated_at_epoch_secs: z.number(),
});

const meQualityDcRttSchema = z.object({
  dc: z.number(),
  rtt_ema_ms: z.number().nullish(),
  alive_writers: z.number(),
  required_writers: z.number(),
  coverage_pct: z.number(),
});

export const runtimeMeQualityDataSchema = z.object({
  enabled: z.boolean(),
  reason: z.string().nullish(),
  generated_at_epoch_secs: z.number(),
  data: z
    .object({
      counters: meQualityCountersSchema,
      route_drops: meQualityRouteDropSchema,
      family_states: z.array(meQualityFamilyStateSchema),
      drain_gate: meQualityDrainGateSchema,
      dc_rtt: z.array(meQualityDcRttSchema),
    })
    .nullable(),
});
export type RuntimeMeQualityData = z.infer<typeof runtimeMeQualityDataSchema>;

// ---------------------------------------------------------------------------
// RuntimeUpstreamQualityData — GET /v1/runtime/upstream_quality
// ---------------------------------------------------------------------------

const upstreamQualityPolicySchema = z.object({
  connect_retry_attempts: z.number(),
  connect_retry_backoff_ms: z.number(),
  connect_budget_ms: z.number(),
  unhealthy_fail_threshold: z.number(),
  connect_failfast_hard_errors: z.boolean(),
});

const upstreamQualityCountersSchema = z.object({
  connect_attempt_total: z.number(),
  connect_success_total: z.number(),
  connect_fail_total: z.number(),
  connect_failfast_hard_error_total: z.number(),
});

const upstreamQualitySummarySchema = z.object({
  configured_total: z.number(),
  healthy_total: z.number(),
  unhealthy_total: z.number(),
  direct_total: z.number(),
  socks4_total: z.number(),
  socks5_total: z.number(),
  shadowsocks_total: z.number(),
});

const upstreamQualityDcSchema = z.object({
  dc: z.number(),
  latency_ema_ms: z.number().nullish(),
  ip_preference: z.string(),
});

const upstreamQualityUpstreamSchema = z.object({
  upstream_id: z.number(),
  route_kind: z.string(),
  address: z.string(),
  weight: z.number(),
  scopes: z.string(),
  healthy: z.boolean(),
  fails: z.number(),
  last_check_age_secs: z.number(),
  effective_latency_ms: z.number().nullish(),
  dc: z.array(upstreamQualityDcSchema),
});

export const runtimeUpstreamQualityDataSchema = z.object({
  enabled: z.boolean(),
  reason: z.string().nullish(),
  generated_at_epoch_secs: z.number(),
  policy: upstreamQualityPolicySchema,
  counters: upstreamQualityCountersSchema,
  summary: upstreamQualitySummarySchema.nullish(),
  upstreams: z.array(upstreamQualityUpstreamSchema).nullish(),
});
export type RuntimeUpstreamQualityData = z.infer<typeof runtimeUpstreamQualityDataSchema>;

// ---------------------------------------------------------------------------
// RuntimeNatStunData — GET /v1/runtime/nat_stun
// ---------------------------------------------------------------------------

const natStunFlagsSchema = z.object({
  nat_probe_enabled: z.boolean(),
  nat_probe_disabled_runtime: z.boolean(),
  nat_probe_attempts: z.number(),
});

const natStunServersSchema = z.object({
  configured: z.array(z.string()),
  live: z.array(z.string()),
  live_total: z.number(),
});

const natStunReflectionSchema = z.object({
  addr: z.string(),
  age_secs: z.number(),
});

const natStunReflectionBlockSchema = z.object({
  v4: natStunReflectionSchema.nullish(),
  v6: natStunReflectionSchema.nullish(),
});

export const runtimeNatStunDataSchema = z.object({
  enabled: z.boolean(),
  reason: z.string().nullish(),
  generated_at_epoch_secs: z.number(),
  data: z
    .object({
      flags: natStunFlagsSchema,
      servers: natStunServersSchema,
      reflection: natStunReflectionBlockSchema,
      stun_backoff_remaining_ms: z.number().nullish(),
    })
    .nullable(),
});
export type RuntimeNatStunData = z.infer<typeof runtimeNatStunDataSchema>;

// ---------------------------------------------------------------------------
// RuntimeMeSelftestData — GET /v1/runtime/me-selftest
// ---------------------------------------------------------------------------

const selftestKdfSchema = z.object({
  state: z.string(),
  ewma_errors_per_min: z.number(),
  threshold_errors_per_min: z.number(),
  errors_total: z.number(),
});

const selftestTimeskewSchema = z.object({
  state: z.string(),
  max_skew_secs_15m: z.number().nullish(),
  samples_15m: z.number(),
  last_skew_secs: z.number().nullish(),
  last_source: z.string().nullish(),
  last_seen_age_secs: z.number().nullish(),
});

const selftestIpFamilySchema = z.object({
  addr: z.string(),
  state: z.string(),
});

const selftestIpSchema = z.object({
  v4: selftestIpFamilySchema.nullish(),
  v6: selftestIpFamilySchema.nullish(),
});

const selftestPidSchema = z.object({
  pid: z.number(),
  state: z.string(),
});

const selftestBndSchema = z.object({
  addr_state: z.string(),
  port_state: z.string(),
  last_addr: z.string().nullish(),
  last_seen_age_secs: z.number().nullish(),
});

export const runtimeMeSelftestDataSchema = z.object({
  enabled: z.boolean(),
  reason: z.string().nullish(),
  generated_at_epoch_secs: z.number(),
  data: z
    .object({
      kdf: selftestKdfSchema,
      timeskew: selftestTimeskewSchema,
      ip: selftestIpSchema,
      pid: selftestPidSchema,
      bnd: selftestBndSchema,
    })
    .nullable(),
});
export type RuntimeMeSelftestData = z.infer<typeof runtimeMeSelftestDataSchema>;

// ---------------------------------------------------------------------------
// MeWritersData / DcStatusData / MinimalAllData
// — GET /v1/stats/me-writers, /v1/stats/dcs, /v1/stats/minimal/all
// ---------------------------------------------------------------------------

const meWritersSummarySchema = z.object({
  configured_dc_groups: z.number(),
  configured_endpoints: z.number(),
  available_endpoints: z.number(),
  available_pct: z.number(),
  required_writers: z.number(),
  alive_writers: z.number(),
  coverage_pct: z.number(),
  fresh_alive_writers: z.number(),
  fresh_coverage_pct: z.number(),
});

const meWriterStatusSchema = z.object({
  writer_id: z.number(),
  dc: z.number().nullish(),
  endpoint: z.string(),
  generation: z.number(),
  state: z.string(),
  draining: z.boolean(),
  degraded: z.boolean(),
  bound_clients: z.number(),
  idle_for_secs: z.number().nullish(),
  rtt_ema_ms: z.number().nullish(),
  matches_active_generation: z.boolean(),
  in_desired_map: z.boolean(),
  allow_drain_fallback: z.boolean(),
  drain_started_at_epoch_secs: z.number().nullish(),
  drain_deadline_epoch_secs: z.number().nullish(),
  drain_over_ttl: z.boolean(),
});

export const meWritersDataSchema = z.object({
  middle_proxy_enabled: z.boolean(),
  reason: z.string().nullish(),
  generated_at_epoch_secs: z.number(),
  summary: meWritersSummarySchema,
  writers: z.array(meWriterStatusSchema),
});
export type MeWritersData = z.infer<typeof meWritersDataSchema>;

const dcEndpointWritersSchema = z.object({
  endpoint: z.string(),
  active_writers: z.number(),
});

const dcStatusSchema = z.object({
  dc: z.number(),
  endpoints: z.array(z.string()),
  endpoint_writers: z.array(dcEndpointWritersSchema),
  available_endpoints: z.number(),
  available_pct: z.number(),
  required_writers: z.number(),
  floor_min: z.number(),
  floor_target: z.number(),
  floor_max: z.number(),
  floor_capped: z.boolean(),
  alive_writers: z.number(),
  coverage_pct: z.number(),
  fresh_alive_writers: z.number(),
  fresh_coverage_pct: z.number(),
  rtt_ms: z.number().nullish(),
  load: z.number(),
});

export const dcStatusDataSchema = z.object({
  middle_proxy_enabled: z.boolean(),
  reason: z.string().nullish(),
  generated_at_epoch_secs: z.number(),
  dcs: z.array(dcStatusSchema),
});
export type DcStatusData = z.infer<typeof dcStatusDataSchema>;

const minimalQuarantineSchema = z.object({
  endpoint: z.string(),
  remaining_ms: z.number(),
});

/**
 * `MinimalMeRuntimeData` has ~50 scalar tuning/state fields; only
 * `quarantined_endpoints` needs its own shape, the rest is rendered
 * generically as a key/value grid.
 */
export const minimalMeRuntimeDataSchema = z
  .object({
    quarantined_endpoints: z.array(minimalQuarantineSchema),
  })
  .catchall(z.union([z.string(), z.number(), z.boolean(), z.null()]));
export type MinimalMeRuntimeData = z.infer<typeof minimalMeRuntimeDataSchema>;

const minimalDcPathSchema = z.object({
  dc: z.number(),
  ip_preference: z.string().nullish(),
  selected_addr_v4: z.string().nullish(),
  selected_addr_v6: z.string().nullish(),
});

export const minimalAllDataSchema = z.object({
  enabled: z.boolean(),
  reason: z.string().nullish(),
  generated_at_epoch_secs: z.number(),
  data: z
    .object({
      me_writers: meWritersDataSchema,
      dcs: dcStatusDataSchema,
      me_runtime: minimalMeRuntimeDataSchema.nullish(),
      network_path: z.array(minimalDcPathSchema),
    })
    .nullable(),
});
export type MinimalAllData = z.infer<typeof minimalAllDataSchema>;

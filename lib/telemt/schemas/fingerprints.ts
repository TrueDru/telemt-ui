import { z } from "zod";

export const tlsFingerprintRowSchema = z.object({
  scope: z.string().nullish(),
  ja3: z.string(),
  ja3_raw: z.string(),
  ja4: z.string(),
  ja4_raw: z.string(),
  total: z.number(),
  auth_success: z.number(),
  bad_or_probe: z.number(),
  first_seen_epoch_secs: z.number(),
  last_seen_epoch_secs: z.number(),
});
export type TlsFingerprintRow = z.infer<typeof tlsFingerprintRowSchema>;

export const runtimeTlsFingerprintsDataSchema = z.object({
  enabled: z.boolean(),
  reason: z.string().nullish(),
  generated_at_epoch_secs: z.number(),
  data: z
    .object({
      limit: z.number(),
      retention_secs: z.number(),
      capacity: z.number(),
      dropped_total: z.number(),
      parse_error_total: z.number(),
      by_fingerprint: z.array(tlsFingerprintRowSchema),
      by_ip: z.array(tlsFingerprintRowSchema),
      by_cidr: z.array(tlsFingerprintRowSchema),
      by_user: z.array(tlsFingerprintRowSchema),
    })
    .nullable(),
});
export type RuntimeTlsFingerprintsData = z.infer<typeof runtimeTlsFingerprintsDataSchema>;

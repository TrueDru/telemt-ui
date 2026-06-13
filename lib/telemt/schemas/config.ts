import { z } from "zod";

/** Top-level config sections exposed/editable via the Control API. */
export const CONFIG_SECTIONS = [
  "general",
  "timeouts",
  "censorship",
  "upstreams",
  "show_link",
  "dc_overrides",
] as const;
export type ConfigSection = (typeof CONFIG_SECTIONS)[number];

/**
 * Each section is a TOML-shaped object; field-level shapes aren't part of
 * the Control API contract, so sections are treated as opaque records here.
 * The config editor (TODO §5) layers stricter per-field schemas on top.
 */
const sectionSchema = z.record(z.string(), z.unknown());

export const configDataSchema = z.object({
  general: sectionSchema.optional(),
  timeouts: sectionSchema.optional(),
  censorship: sectionSchema.optional(),
  upstreams: sectionSchema.optional(),
  show_link: sectionSchema.optional(),
  dc_overrides: sectionSchema.optional(),
});
export type ConfigData = z.infer<typeof configDataSchema>;

/** Sparse patch: only the sections being changed. */
export const patchConfigRequestSchema = z
  .object({
    general: sectionSchema.optional(),
    timeouts: sectionSchema.optional(),
    censorship: sectionSchema.optional(),
    upstreams: sectionSchema.optional(),
    show_link: sectionSchema.optional(),
    dc_overrides: sectionSchema.optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, "patch must contain at least one section");
export type PatchConfigRequest = z.infer<typeof patchConfigRequestSchema>;

export const patchConfigResponseSchema = z.object({
  revision: z.string(),
  restart_required: z.boolean(),
  changed: z.array(z.string()),
});
export type PatchConfigResponse = z.infer<typeof patchConfigResponseSchema>;

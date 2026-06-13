import { describe, expect, it } from "vitest";
import { configDataSchema, patchConfigRequestSchema, patchConfigResponseSchema } from "./config";

describe("configDataSchema", () => {
  it("accepts a config with a subset of sections", () => {
    const result = configDataSchema.safeParse({
      general: { read_only: false },
      timeouts: { idle_secs: 60 },
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object (no sections returned)", () => {
    expect(configDataSchema.safeParse({}).success).toBe(true);
  });
});

describe("patchConfigRequestSchema", () => {
  it("accepts a patch touching one or more sections", () => {
    const result = patchConfigRequestSchema.safeParse({ general: { read_only: true } });
    expect(result.success).toBe(true);
  });

  it("rejects an empty patch", () => {
    const result = patchConfigRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("patchConfigResponseSchema", () => {
  it("parses a typical response", () => {
    const result = patchConfigResponseSchema.safeParse({
      revision: "sha256-abc",
      restart_required: true,
      changed: ["general.read_only"],
    });
    expect(result.success).toBe(true);
  });
});

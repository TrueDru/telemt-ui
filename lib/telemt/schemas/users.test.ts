import { describe, expect, it } from "vitest";
import {
  createUserRequestSchema,
  hex32Schema,
  patchUserRequestSchema,
  usernameSchema,
} from "./users";

describe("usernameSchema", () => {
  it.each(["alice", "a.b-c_d", "A1", "x".repeat(64)])("accepts %s", (value) => {
    expect(usernameSchema.safeParse(value).success).toBe(true);
  });

  it.each(["", "x".repeat(65), "has space", "bad/char", "emoji-🙂"])("rejects %s", (value) => {
    expect(usernameSchema.safeParse(value).success).toBe(false);
  });
});

describe("hex32Schema", () => {
  it("accepts exactly 32 lowercase or uppercase hex chars", () => {
    expect(hex32Schema.safeParse("a".repeat(32)).success).toBe(true);
    expect(hex32Schema.safeParse("ABCDEF0123456789abcdef0123456789".slice(0, 32)).success).toBe(
      true,
    );
  });

  it("rejects wrong length or non-hex chars", () => {
    expect(hex32Schema.safeParse("a".repeat(31)).success).toBe(false);
    expect(hex32Schema.safeParse("a".repeat(33)).success).toBe(false);
    expect(hex32Schema.safeParse("g".repeat(32)).success).toBe(false);
  });
});

describe("createUserRequestSchema", () => {
  it("accepts a minimal request with just a username", () => {
    const result = createUserRequestSchema.safeParse({ username: "alice" });
    expect(result.success).toBe(true);
  });

  it("accepts a fully populated request", () => {
    const result = createUserRequestSchema.safeParse({
      username: "alice",
      secret: "a".repeat(32),
      user_ad_tag: "b".repeat(32),
      max_tcp_conns: 10,
      expiration_rfc3339: "2030-01-01T00:00:00Z",
      data_quota_bytes: 1_000_000,
      rate_limit_up_bps: 1000,
      rate_limit_down_bps: 1000,
      max_unique_ips: 3,
      enabled: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a secret that isn't 32 hex chars", () => {
    const result = createUserRequestSchema.safeParse({ username: "alice", secret: "not-hex" });
    expect(result.success).toBe(false);
  });

  it("rejects negative numeric limits", () => {
    const result = createUserRequestSchema.safeParse({ username: "alice", max_tcp_conns: -1 });
    expect(result.success).toBe(false);
  });
});

describe("patchUserRequestSchema", () => {
  it("allows an empty patch (no fields changed)", () => {
    expect(patchUserRequestSchema.safeParse({}).success).toBe(true);
  });

  it("allows null to clear a per-user override", () => {
    const result = patchUserRequestSchema.safeParse({
      data_quota_bytes: null,
      max_unique_ips: null,
      expiration_rfc3339: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a null secret (secret can only be set, not cleared)", () => {
    const result = patchUserRequestSchema.safeParse({ secret: null });
    expect(result.success).toBe(false);
  });
});

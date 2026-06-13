import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fmtBps, fmtBytes, fmtNum, fmtUptime, isExpired, relFuture, relTime } from "./format";

describe("fmtNum", () => {
  it("formats with thousands separators", () => {
    expect(fmtNum(1234567)).toBe("1,234,567");
  });

  it("renders an em dash for null/undefined", () => {
    expect(fmtNum(null)).toBe("—");
    expect(fmtNum(undefined)).toBe("—");
  });
});

describe("fmtUptime", () => {
  it("renders days and hours", () => {
    expect(fmtUptime(2 * 86400 + 3 * 3600)).toBe("2d 3h");
  });

  it("renders hours and minutes", () => {
    expect(fmtUptime(2 * 3600 + 5 * 60)).toBe("2h 5m");
  });

  it("renders minutes only", () => {
    expect(fmtUptime(45 * 60)).toBe("45m");
  });
});

describe("fmtBytes", () => {
  it("renders zero bytes", () => {
    expect(fmtBytes(0)).toBe("0 B");
  });

  it("renders an em dash for null/undefined", () => {
    expect(fmtBytes(null)).toBe("—");
    expect(fmtBytes(undefined)).toBe("—");
  });

  it("scales to KB/MB/GB", () => {
    expect(fmtBytes(1024)).toBe("1.0 KB");
    expect(fmtBytes(1024 * 1024 * 2.5)).toBe("2.5 MB");
  });
});

describe("fmtBps", () => {
  it("treats null/undefined/zero as unlimited", () => {
    expect(fmtBps(null)).toBe("unlimited");
    expect(fmtBps(undefined)).toBe("unlimited");
    expect(fmtBps(0)).toBe("unlimited");
  });

  it("scales to Kbps/Mbps", () => {
    expect(fmtBps(1000)).toBe("1.0 Kbps");
    expect(fmtBps(2_500_000)).toBe("2.5 Mbps");
  });
});

describe("time helpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("relTime renders relative past times", () => {
    const now = Date.now();
    expect(relTime(now)).toBe("just now");
    expect(relTime(now - 30_000)).toBe("30s ago");
    expect(relTime(now - 5 * 60_000)).toBe("5m ago");
    expect(relTime(now - 3 * 3600_000)).toBe("3h ago");
    expect(relTime(now - 2 * 86400_000)).toBe("2d ago");
  });

  it("relFuture renders relative future times and falls back for the past", () => {
    const now = Date.now();
    expect(relFuture(now + 30_000)).toBe("in 30s");
    expect(relFuture(now + 5 * 60_000)).toBe("in 5m");
    expect(relFuture(now + 3 * 3600_000)).toBe("in 3h");
    expect(relFuture(now + 2 * 86400_000)).toBe("in 2d");
    expect(relFuture(now - 30_000)).toBe("30s ago");
  });

  it("isExpired compares against the current time", () => {
    const now = Date.now();
    expect(isExpired(new Date(now - 1000).toISOString())).toBe(true);
    expect(isExpired(new Date(now + 1000).toISOString())).toBe(false);
  });
});

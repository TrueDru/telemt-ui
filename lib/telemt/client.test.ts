import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { TelemtApiError, TelemtClientError } from "./errors";

vi.mock("@/lib/env", () => ({
  getInstance: vi.fn(() => ({
    id: "vps1",
    label: "VPS 1",
    baseUrl: "https://telemt.example.test",
    authHeader: "Bearer secret-token",
  })),
}));

const { telemtRequest, telemt } = await import("./client");

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("telemtRequest", () => {
  it("injects the Authorization header and parses a success envelope", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(200, { ok: true, data: { status: "ok" }, revision: "rev-1" }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await telemtRequest("vps1", "/v1/health", z.object({ status: z.string() }));

    expect(result).toEqual({ data: { status: "ok" }, revision: "rev-1" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://telemt.example.test/v1/health");
    expect(init.headers.Authorization).toBe("Bearer secret-token");
    expect(init.method).toBe("GET");
  });

  it("appends query parameters and skips undefined values", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { ok: true, data: [], revision: "rev-1" }));
    vi.stubGlobal("fetch", fetchMock);

    await telemtRequest("vps1", "/v1/runtime/events/recent", z.array(z.unknown()), {
      query: { limit: 10, cursor: undefined },
    });

    const [url] = fetchMock.mock.calls[0];
    expect(new URL(String(url)).searchParams.get("limit")).toBe("10");
    expect(new URL(String(url)).searchParams.has("cursor")).toBe(false);
  });

  it("sends a JSON body and If-Match header for PATCH requests", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { ok: true, data: { ok: true }, revision: "rev-2" }));
    vi.stubGlobal("fetch", fetchMock);

    await telemtRequest("vps1", "/v1/config", z.object({ ok: z.boolean() }), {
      method: "PATCH",
      body: { read_only: true },
      ifMatch: "rev-1",
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("PATCH");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers["If-Match"]).toBe("rev-1");
    expect(init.body).toBe(JSON.stringify({ read_only: true }));
  });

  it("throws TelemtApiError for an error envelope", async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        jsonResponse(409, {
          ok: false,
          error: { code: "revision_conflict", message: "stale revision" },
          request_id: "req-123",
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(telemtRequest("vps1", "/v1/config", z.unknown())).rejects.toMatchObject({
      code: "revision_conflict",
      status: 409,
      requestId: "req-123",
    });
    await expect(telemtRequest("vps1", "/v1/config", z.unknown())).rejects.toBeInstanceOf(
      TelemtApiError,
    );
  });

  it("throws TelemtClientError when the response body doesn't match the schema", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(200, { ok: true, data: { unexpected: true }, revision: "r" }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      telemtRequest("vps1", "/v1/health", z.object({ status: z.string() })),
    ).rejects.toBeInstanceOf(TelemtClientError);
  });

  it("throws TelemtClientError when the request itself fails", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(telemtRequest("vps1", "/v1/health", z.unknown())).rejects.toThrow(
      /Couldn't reach telemt instance "VPS 1": network down/,
    );
  });

  it("throws TelemtClientError on a non-JSON error response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("not json", { status: 502 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(telemtRequest("vps1", "/v1/health", z.unknown())).rejects.toThrow(
      /non-JSON response \(HTTP 502\)/,
    );
  });
});

describe("telemt.users", () => {
  it("encodes the username in the path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        ok: true,
        data: { username: "a b", enabled: true },
        revision: "rev-1",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await telemt.users.get("vps1", "a b").catch(() => {
      // Schema validation isn't the point of this test; we only assert the request shape.
    });

    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://telemt.example.test/v1/users/a%20b");
  });
});

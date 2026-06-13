import { NextRequest, NextResponse } from "next/server";
import { getInstance } from "@/lib/env";
import { errorEnvelopeBody } from "@/lib/telemt/errors";

/**
 * Generic BFF proxy: forwards `/api/telemt/<...path>?instance=<id>` to
 * `<instance.baseUrl>/v1/<...path>`, injecting the instance's Authorization
 * header server-side so it never reaches the browser. Passes the response
 * envelope through unchanged.
 */
async function handler(req: NextRequest, ctx: RouteContext<"/api/telemt/[...path]">) {
  const { path } = await ctx.params;

  const instanceId = req.nextUrl.searchParams.get("instance");
  if (!instanceId) {
    return NextResponse.json(errorEnvelopeBody("bad_request", "Missing ?instance=<id>"), {
      status: 400,
    });
  }

  let instance;
  try {
    instance = getInstance(instanceId);
  } catch {
    return NextResponse.json(
      errorEnvelopeBody("unknown_instance", `Unknown telemt instance "${instanceId}"`),
      { status: 404 },
    );
  }

  const target = new URL(`/v1/${path.join("/")}`, instance.baseUrl);
  req.nextUrl.searchParams.forEach((value, key) => {
    if (key !== "instance") target.searchParams.append(key, value);
  });

  const headers: Record<string, string> = { Authorization: instance.authHeader };
  const ifMatch = req.headers.get("if-match");
  if (ifMatch) headers["If-Match"] = ifMatch;

  let body: string | undefined;
  if (!["GET", "HEAD", "DELETE"].includes(req.method)) {
    const text = await req.text();
    if (text) {
      headers["Content-Type"] = "application/json";
      body = text;
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, { method: req.method, headers, body, cache: "no-store" });
  } catch (err) {
    return NextResponse.json(
      errorEnvelopeBody(
        "upstream_unreachable",
        `Couldn't reach instance "${instance.label}": ${(err as Error).message}`,
      ),
      { status: 502 },
    );
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };

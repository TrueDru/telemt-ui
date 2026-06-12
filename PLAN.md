# telemt-ui — Tech Plan

Web UI for the Telemt MTProxy control API (`docs/Architecture/API/API.md` in
the `telemt` repo). Read-heavy dashboard + a handful of mutating actions
(user CRUD, config patch). API itself is plain HTTP/1.1 JSON behind an
optional static `Authorization` header and IP whitelist — no TLS, no OAuth.

## Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
  - Route Handlers act as a BFF/proxy to the Telemt API. Keeps `auth_header`
    secrets server-side only — never shipped to the browser.
  - Server Components for initial data, Client Components + TanStack Query
    for live-polling panels.
- **Styling/UI**: Tailwind CSS + shadcn/ui (Radix primitives). Tremor-style
  dashboard widgets (cards, sparkline, progress bars) built on top of
  Recharts for charts (RTT, throughput, coverage %).
- **Data fetching**: TanStack Query — polling intervals tuned to the API's
  own cache TTLs (`minimal_runtime_cache_ttl_ms`, `runtime_edge_cache_ttl_ms`,
  default 1000ms) so the UI doesn't poll faster than the server caches.
- **Forms/validation**: react-hook-form + zod. Zod schemas mirror the
  request contracts in API.md exactly (e.g. `secret`: 32 hex chars,
  `username`: `[A-Za-z0-9_.-]{1,64}`).
- **Typed API client**: hand-written `lib/telemt/*` typed client + zod
  schemas for every response contract in API.md (`UserInfo`, `ConfigData`,
  `ZeroAllData`, `RuntimeMePoolStateData`, ...). Generated once, not via
  OpenAPI (Telemt has no OpenAPI spec).

## Multi-server support

Telemt is deployed per-VPS; a real user runs several nodes. UI config is a
server-side list of instances:

```ts
// telemt.config.ts (or DB row later)
{ id: "vps-1", label: "Frankfurt", baseUrl: "http://10.0.0.2:9091", authHeader: env.TELEMT_VPS1_TOKEN }
```

All proxy route handlers take `?instance=vps-1`, look up base URL + token
server-side, forward to `/v1/...`, and pass through the JSON envelope.
`revision` / `If-Match` flow straight through.

## UI auth (the app itself)

Repo will go public; a deployed instance must not be openly reachable.
Simple shared-secret session: a single password (env var) gates the whole
app via a signed cookie set on login (`iron-session` or NextAuth Credentials
provider). No per-user accounts needed for v1 — this is an ops tool.

## Page map

1. **Dashboard** — `/v1/health`, `/v1/health/ready`, `/v1/system/info`,
   `/v1/runtime/gates`, `/v1/stats/summary`. Status chips + uptime + restart
   indicator.
2. **Users** (`/users`) — table from `GET /v1/users`, per-row actions
   (enable/disable/rotate-secret/reset-quota/delete), create-user dialog,
   per-user detail drawer showing `links` (classic/secure/tls) rendered as
   `tg://` buttons + QR codes.
3. **Config** (`/config`) — editable sections (`general`, `timeouts`,
   `censorship`, `upstreams`, `show_link`, `dc_overrides`) as forms grouped
   by section; diff preview before `PATCH`, `If-Match` from last-fetched
   revision, `409 revision_conflict` retry flow, `restart_required` banner.
4. **Runtime / Diagnostics** (`/runtime`) — tabs: ME pool state, ME quality
   (per-DC RTT/coverage), upstream quality, NAT/STUN, ME self-test, DC
   status table, ME writers table. All polling, all tolerant of
   `enabled=false` / `reason=feature_disabled|source_unavailable`.
5. **Security** (`/security`) — posture flags + whitelist CIDR list
   (read-only display; whitelist isn't PATCH-able).
6. **Events & Fingerprints** (`/events`) — `/v1/runtime/events/recent` live
   feed (ring buffer) + `/v1/runtime/tls-fingerprints` JA3/JA4 leaderboards
   (by fingerprint / IP / CIDR / user).

## Cross-cutting

- Every panel must render the `enabled=false` / `reason=...` degraded states
  from API.md's Runtime State Matrix — these are normal, not errors.
- Error envelope (`{ok:false, error:{code,message}, request_id}`) mapped to
  a shared toast + inline error component, switched on `error.code`.
- Optimistic concurrency: cache last `revision` from any successful response
  and use it as `If-Match` on the next `PATCH`.

## Deployment

Single Docker image (Next.js standalone output), `docker-compose.yml`
alongside the telemt node(s). Env vars: `APP_PASSWORD`, per-instance
`TELEMT_<ID>_BASE_URL` / `TELEMT_<ID>_AUTH_HEADER`.

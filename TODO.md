# TODO

Tracking doc for telemt-ui build. See `PLAN.md` for stack rationale and
`DESIGN_PROMPT.md` for the design pass.

## 0. Scaffolding

- [x] `create-next-app` (TS, App Router, Tailwind, ESLint)
- [x] shadcn/ui init + base components (Button, Card, Table, Tabs, Dialog,
      Sheet, Badge, Progress, Toast, Input, Switch)
- [x] Prettier + ESLint config, `.editorconfig`
- [x] Env schema (`zod`-validated) for `APP_PASSWORD`,
      `TELEMT_<ID>_BASE_URL`, `TELEMT_<ID>_AUTH_HEADER`

## 1. API layer

- [x] zod schemas for response contracts in API.md (start with: Health,
      SystemInfo, RuntimeGates, Summary, UserInfo, ConfigData,
      PatchConfigResponse)
- [x] zod schemas for request contracts (CreateUserRequest,
      PatchUserRequest, PatchConfigRequest, RotateSecretRequest) — enforce
      32-hex secrets, username regex, etc.
- [x] typed client (`lib/telemt/client.ts`): wraps fetch, injects
      `Authorization`, handles envelope (`ok`/`error`/`revision`),
      surfaces `request_id` on error
- [x] Next route handlers `app/api/telemt/[...path]/route.ts` — proxy +
      multi-instance lookup by `?instance=`
- [x] error-code -> UI message map (table from API.md "Common Error Codes")

## 2. Auth & shell

- [x] login page + signed-cookie session gate (shared `APP_PASSWORD`)
- [x] app shell: sidebar nav, instance switcher, health dot per nav item
- [x] dark/light theme toggle

## 3. Dashboard page

- [x] stat cards: uptime, connections_total, configured_users, read_only,
      route_mode
- [x] gates panel (admission/ME readiness/reroute chips)
- [x] recent-events ticker (`/v1/runtime/events/recent`, degrade gracefully
      if `runtime_edge_enabled=false`)

## 4. Users page

- [ ] users table (`GET /v1/users`) with sort/search
- [ ] row actions: enable, disable, reset-quota, rotate-secret, delete
      (with confirm dialogs; `last_user_forbidden` handling on delete)
- [ ] create-user dialog (`POST /v1/users`)
- [ ] user detail drawer: limits edit form (`PATCH /v1/users/{username}`,
      JSON-merge-patch null-to-clear semantics)
- [ ] links section: `tg://proxy` buttons + QR codes for classic/secure/tls + `tls_domains`

## 5. Config page

- [ ] fetch `GET /v1/config`, store `revision`
- [ ] section forms: general, timeouts, censorship, upstreams, show_link,
      dc_overrides
- [ ] dirty-state diff + save bar, `If-Match` on PATCH,
      `409 revision_conflict` -> refetch+retry prompt
- [ ] `restart_required` banner/notice after save

## 6. Runtime/diagnostics page

- [ ] ME pool state tab (generations, hardswap, writer contour/health)
- [ ] ME quality tab (counters, route drops, per-DC RTT/coverage)
- [ ] upstream quality tab (policy, counters, per-upstream table)
- [ ] NAT/STUN tab
- [ ] ME self-test tab (KDF, time-skew, IP, PID, BND)
- [ ] DC status table + ME writers table (minimal/all)
- [ ] shared "feature disabled / source unavailable" empty-state component

## 7. Security page

- [ ] posture flags card
- [ ] whitelist CIDR list

## 8. Fingerprints

- [ ] JA3/JA4 leaderboard tabs (by-fingerprint/IP/CIDR/user) with
      `limit` query control

## 9. Polish & ops

- [ ] global toast/error handling wired to error envelope
- [ ] loading/empty/error states for every panel
- [ ] responsive layout pass (mobile sidebar)
- [ ] unit tests for API client + zod schemas (vitest)
- [ ] component tests (RTL) for forms (create user, config patch)
- [ ] Dockerfile (Next standalone output) + docker-compose alongside telemt
- [ ] CI: lint + typecheck + test + build
- [ ] README: setup, env vars, multi-instance config

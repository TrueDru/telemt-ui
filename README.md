# telemt-ui

A web control panel for [telemt](https://github.com/telemt/telemt) MTProto
proxy instances, built on telemt's Control API (see
[API.md](https://github.com/telemt/telemt/blob/main/docs/Architecture/API/API.md)).
Next.js App Router BFF that proxies the Control API server-side (so instance
tokens never reach the browser), with a password-gated UI for managing
users, config, and runtime diagnostics across one or more telemt
deployments.

telemt-ui does not run telemt itself — see
[Prerequisites](#prerequisites) to set up a telemt instance with its
Control API exposed first.

## Features

- **Dashboard** — uptime, connection counts, admission/readiness gates,
  recent edge events.
- **Users** — table with sort/search/filters, create/enable/disable/rotate
  secret/reset quota/delete, per-user limits editor, `tg://` proxy links +
  QR codes.
- **Config** — editable `general` / `timeouts` / `censorship` / `upstreams`
  / `show_link` / `dc_overrides` sections with dirty-state diffing,
  optimistic-concurrency saves (`If-Match` / `revision`), and
  restart-required notices.
- **Runtime** — ME pool state, ME quality, upstream quality, NAT/STUN, ME
  self-test, DC status, and ME writer tables.
- **Security** — posture flags and IP whitelist.
- **Fingerprints** — JA3/JA4 TLS leaderboards by fingerprint/IP/CIDR/user.
- Multi-instance: switch between several telemt deployments from one UI.

## Prerequisites

Each instance you manage needs a running
[telemt](https://github.com/telemt/telemt) server with its Control API
enabled and reachable from wherever telemt-ui runs:

```toml
[server.api]
enabled = true
listen = "0.0.0.0:9091"        # or 127.0.0.1:9091 if telemt-ui runs on the same host
auth_header = "Bearer <token>"  # required — an empty string disables auth checks
whitelist = ["10.0.0.0/8"]       # must include the address telemt-ui connects from
```

`auth_header` and `whitelist` are documented in telemt's
[config reference](https://github.com/telemt/telemt/blob/main/docs/Config_params/CONFIG_PARAMS.en.md#auth_header).
The `<token>` chosen here is what you'll put in `TELEMT_<ID>_AUTH_HEADER`
below.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in APP_PASSWORD and TELEMT_* below
npm run dev
```

Open http://localhost:3000 and sign in with `APP_PASSWORD`.

## Environment variables

See `.env.example` for the full annotated list. Summary:

| Variable                  | Required | Description                                                                     |
| ------------------------- | -------- | ------------------------------------------------------------------------------- |
| `APP_PASSWORD`            | yes      | Shared password gating the UI (min 8 chars). Also signs the session cookie.     |
| `TELEMT_<ID>_BASE_URL`    | yes      | Base URL of a telemt Control API instance, e.g. `http://10.0.0.2:9091`.         |
| `TELEMT_<ID>_AUTH_HEADER` | yes      | Full `Authorization` header value sent to that instance, e.g. `Bearer <token>`. |
| `TELEMT_<ID>_LABEL`       | no       | Display name for the instance switcher (defaults to `<ID>`).                    |

`<ID>` is any `[A-Z0-9_]+` identifier and becomes the instance id
(lowercased, `_` → `-`) used in the instance switcher and the
`?instance=` query param on the proxy routes. Define one `TELEMT_<ID>_*`
block per telemt instance to manage — at least one is required.

## Scripts

| Command                | Description                           |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | Start the dev server.                 |
| `npm run build`        | Production build (standalone output). |
| `npm start`            | Run a production build.               |
| `npm run lint`         | ESLint.                               |
| `npm run format:check` | Prettier check.                       |
| `npm run typecheck`    | `tsc --noEmit`.                       |
| `npm test`             | Run the vitest suite.                 |

## Docker

```bash
cp .env.example .env   # fill in real values
docker compose up -d --build
```

This builds the standalone Next.js image from the `Dockerfile` and serves
the app on port 3000. If telemt itself runs as a container on the same
compose project, point `TELEMT_<ID>_BASE_URL` at its service name (see the
commented-out example in `docker-compose.yml`) instead of an IP/hostname.

## CI

`.github/workflows/ci.yml` runs format check, lint, typecheck, tests, and
build on every push/PR to `main`.

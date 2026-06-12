# Design prompt for Claude (UI/visual design pass)

Use this prompt when asking Claude (e.g. in claude.ai, or a `/design`-style
session) to produce visual design direction / component mockups for
telemt-ui, before or alongside implementation.

---

**Prompt:**

I'm building an admin dashboard web UI for "Telemt", a self-hosted MTProto
proxy server (Rust). The UI talks to a JSON REST control API over HTTP
(`/v1/...`). Audience: technical operators (sysadmins running 1-10 VPS
nodes), not end users of the proxy.

Stack: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
(Radix) + Recharts. Dark-mode-first, dense information layout — think
Grafana / Vercel dashboard / Tailscale admin console aesthetic, not a
marketing site. Should also work acceptably in light mode.

Design the following surfaces:

1. **App shell** — left sidebar nav (Dashboard, Users, Config, Runtime,
   Security, Events) with a server/instance switcher at the top (multiple
   proxy nodes), status dot per nav item showing health.

2. **Dashboard** — top row of stat cards (uptime, connections total,
   configured users, read-only mode flag, route mode), a "gates" panel
   showing boolean admission/ME-readiness flags as colored chips, and a
   small recent-events ticker.

3. **Users table** — columns: username, enabled toggle, current
   connections, active unique IPs, total octets (human-readable bytes),
   quota usage (progress bar if `data_quota_bytes` set), expiration,
   row actions menu (rotate secret, disable/enable, reset quota, delete).
   Row click opens a detail drawer with per-mode `tg://proxy` links shown
   as copy-buttons + QR codes, and an edit form for limits
   (`max_tcp_conns`, `rate_limit_up_bps`/`down_bps`, `max_unique_ips`,
   `data_quota_bytes`, `expiration_rfc3339`, `user_ad_tag`).

4. **Create user dialog** — username, optional secret (with "generate"
   button), optional limits — collapsible "advanced" section.

5. **Config editor** — accordion/tabs per editable section (`general`,
   `timeouts`, `censorship`, `upstreams`, `show_link`, `dc_overrides`).
   Each field rendered with the right input type (toggle, number, text,
   array editor for CIDR/domain lists). A sticky "Save changes" bar appears
   when dirty, shows a diff summary, and a destructive-style confirm if
   `restart_required` would be true (server.api/timeouts/censorship/
   upstreams/general.modes changes need a manual restart).

6. **Runtime/diagnostics tabs** — per-DC table (RTT, coverage %, writer
   counts, floor min/target/max) with coverage rendered as a small
   horizontal bar; ME pool generation/hardswap state as a compact timeline;
   upstream health table; NAT/STUN reflection card. Any panel may receive
   `enabled:false, reason:"feature_disabled"|"source_unavailable"` — design
   a calm empty-state for this (not an error state).

7. **JA3/JA4 fingerprint leaderboard** — sortable table with tabs for
   by-fingerprint / by-IP / by-CIDR / by-user, showing total / auth_success
   / bad_or_probe counts and first/last seen as relative time.

Deliverables: describe the layout structure, color/spacing tokens (Tailwind
scale), and component composition (which shadcn/ui primitives — Card,
Table, Tabs, Sheet, Dialog, Badge, Progress, etc. — per surface). Call out
any custom components needed beyond shadcn/ui defaults.

---

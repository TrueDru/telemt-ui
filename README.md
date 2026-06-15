# telemt-ui

Web UI for managing telemt proxy users. Create, enable/disable, and
delete users; set per-user quotas, rate limits, connection/IP caps, and
expiry; rotate secrets and reset usage; view and copy `tg://proxy`
links. Also shows telemt's health, readiness, and upstream status at a
glance.

## Deploy

```bash
mkdir -p telemt-config data
curl -O https://raw.githubusercontent.com/TrueDru/telemt-ui/main/docker-compose.yml
curl -o telemt-config/config.toml https://raw.githubusercontent.com/TrueDru/telemt-ui/main/telemt-config/config.toml
```

Edit `telemt-config/config.toml`:
- Set `tls_domain` to a real HTTPS site for TLS camouflage
- Add your initial users under `[access.users]` (or skip and add via the UI)

**Important:** telemt runs as a non-root user (uid 65532) and needs write
access to its config directory to persist changes made through the UI:

```bash
chmod 777 telemt-config
chmod 666 telemt-config/config.toml
```

Then start:

```bash
docker compose pull
docker compose up -d
```

This starts:
- `telemt` — proxy on port 443, Control API on `0.0.0.0:9091` (internal
  to the compose network, not published to the host)
- `telemt-ui` — web UI on `127.0.0.1:5000`

## Access the UI

The UI has no auth, so it's bound to localhost only by default. Reach it
via SSH tunnel:

```bash
ssh -L 5000:localhost:5000 user@your-vds
```

Then open `http://localhost:5000`.

To expose it on your LAN instead, change the port mapping in
`docker-compose.yml` to e.g. `5000:5000`.

## First-time UI setup

In **Connection settings**:

- **Public proxy address** — set to your VDS's IP/domain + port (e.g.
  `1.2.3.4:443`). telemt's own links use its internal address; this
  overrides it so copied links point to your real endpoint.
- **Authorization header** — if you set `auth_header` in `config.toml`,
  enter the same value here (e.g. `Bearer change-me`).

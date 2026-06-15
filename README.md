# telemt-ui

Web UI for managing telemt proxy users. Create, enable/disable, and
delete users; set per-user quotas, rate limits, connection/IP caps, and
expiry; rotate secrets and reset usage; view and copy `tg://proxy`
links. Also shows telemt's health, readiness, and upstream status at a
glance.

## Deploy with docker compose

Grab the two files you need from this repo:

```bash
mkdir -p telemt-config
curl -O https://raw.githubusercontent.com/TrueDru/telemt-ui/main/docker-compose.yml
curl -o telemt-config/config.toml https://raw.githubusercontent.com/TrueDru/telemt-ui/main/telemt-config/config.toml
```

Edit `telemt-config/config.toml` for your real `tls_domain` and users, then:

```bash
docker compose pull
docker compose up -d
```

This starts:
- `telemt`, exposing `443` to the host, Control API on `0.0.0.0:9091`
  (internal to the compose network only — not published to the host)
- `telemt-ui` on `127.0.0.1:5000`, talking to telemt via
  `http://telemt:9091`

The UI has no auth, so it's bound to localhost only by default. Reach it
via an SSH tunnel: `ssh -L 5000:localhost:5000 user@host`, then open
`http://localhost:5000`. To expose it on your LAN instead, change the
port mapping to e.g. `192.168.x.x:5000:5000` or `5000:5000`.

In the UI's connection settings, set "Public proxy address" to your
VDS's IP/domain + port (e.g. `1.2.3.4:443`) — telemt's own links use its
internal address, this overrides it for display/copy.

If you set `auth_header` in `config.toml`, set the same value in the
Authorization header field in UI settings.

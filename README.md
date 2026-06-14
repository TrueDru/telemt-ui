# telemt-py-ui

Minimal web UI for managing telemt users via its Control API. One file,
no auth, no build step.

```bash
pip install -r requirements.txt

export TELEMT_API_URL=http://127.0.0.1:9091
export TELEMT_AUTH_HEADER="Bearer <token>"   # only if auth_header is set in telemt's config

python app.py
```

Open http://localhost:5000. Lets you create/enable/disable/delete users,
rotate secrets, reset quotas, and view `tg://proxy` links.

telemt's `config.toml` needs:

```toml
[server.api]
enabled = true
listen = "127.0.0.1:9091"
```

## Deploy with docker compose

This repo includes `docker-compose.yml` + `Dockerfile` for telemt-py-ui, and
an example `telemt-config/config.toml` for telemt itself:

```bash
docker compose up -d --build
```

This starts:
- `telemt`, exposing `443` to the host, Control API on `0.0.0.0:9091`
  (internal to the compose network only — not published to the host)
- `telemt-py-ui` on `0.0.0.0:5000`, reachable from your LAN
  (e.g. `http://192.168.3.x:5000`), talking to telemt via
  `http://telemt:9091`

Edit `telemt-config/config.toml` for your real `tls_domain` and users.
Set `auth_header` there and `TELEMT_AUTH_HEADER` in `docker-compose.yml`
for an extra auth layer on top of network isolation.

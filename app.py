"""Minimal web UI for managing telemt users via its Control API.

No auth, no build step — single file, stdlib + Flask only.

Connection settings (Control API URL, auth header, public proxy address)
are configured from the UI and persisted to /app/data/settings.json.
"""

import json
import os
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from urllib.request import Request, urlopen

from flask import Flask, flash, redirect, render_template_string, request, url_for

CONFIG_FILE = "/app/data/settings.json"

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "telemt-py-ui")


def load_config():
    cfg = {
        "api_url": os.environ.get("TELEMT_API_URL", "http://telemt:9091").rstrip("/"),
        "auth_header": os.environ.get("TELEMT_AUTH_HEADER", ""),
        "external_addr": os.environ.get("TELEMT_EXTERNAL_ADDR", ""),
    }
    try:
        with open(CONFIG_FILE) as f:
            cfg.update(json.load(f))
    except (OSError, ValueError):
        pass
    return cfg


CONFIG = load_config()


def api(method, path, body=None):
    """Call the telemt Control API. Returns (data, error_message)."""
    req = Request(CONFIG["api_url"] + path, method=method)
    if CONFIG["auth_header"]:
        req.add_header("Authorization", CONFIG["auth_header"])
    if body is not None:
        req.add_header("Content-Type", "application/json")
        req.data = json.dumps(body).encode()
    try:
        with urlopen(req, timeout=10) as resp:
            payload = json.loads(resp.read())
    except HTTPError as e:
        try:
            payload = json.loads(e.read())
        except ValueError:
            return None, f"HTTP {e.code}"
    except URLError as e:
        return None, f"Can't reach telemt API at {CONFIG['api_url']}: {e.reason}"

    if not payload.get("ok"):
        return None, payload.get("error", {}).get("message", "API error")
    return payload.get("data"), None


def fmt_bytes(n):
    if n is None:
        return "—"
    n = float(n)
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if n < 1024 or unit == "TB":
            return f"{n:.0f} {unit}" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024


def fmt_uptime(seconds):
    if seconds is None:
        return "—"
    seconds = int(seconds)
    days, seconds = divmod(seconds, 86400)
    hours, seconds = divmod(seconds, 3600)
    minutes, seconds = divmod(seconds, 60)
    parts = []
    if days:
        parts.append(f"{days}d")
    if hours:
        parts.append(f"{hours}h")
    if minutes:
        parts.append(f"{minutes}m")
    if not parts:
        parts.append(f"{seconds}s")
    return " ".join(parts)


def rewrite_link(link, addr):
    """Swap the server/port in a proxy link for an externally reachable address."""
    if not addr:
        return link
    host, _, port = addr.rpartition(":") if ":" in addr else (addr, "", "")
    parts = urlsplit(link)
    query = []
    for k, v in parse_qsl(parts.query, keep_blank_values=True):
        if k == "server":
            v = host
        elif k == "port" and port:
            v = port
        query.append((k, v))
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


PAGE = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>telemt users</title>
  <style>
    :root {
      --bg: #f3f4f6;
      --card: #ffffff;
      --border: #e5e7eb;
      --text: #1f2328;
      --muted: #6b7280;
      --primary: #3b82f6;
      --primary-dark: #2563eb;
      --danger: #ef4444;
      --danger-bg: #fef2f2;
      --ok: #16a34a;
      --ok-bg: #ecfdf3;
      --radius: 10px;
      --shadow: 0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04);
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg); color: var(--text);
      max-width: 1100px; margin: 0 auto; padding: 2rem 1.25rem 4rem;
      line-height: 1.5;
    }
    h1 { font-size: 1.35rem; font-weight: 600; margin: 0 0 1rem; display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
    h1 .api-url { font-size: 0.85rem; font-weight: 400; color: var(--muted); }
    .card {
      background: var(--card); border: 1px solid var(--border); border-radius: var(--radius);
      box-shadow: var(--shadow); padding: 1rem 1.25rem; margin-bottom: 1.25rem;
    }
    .card-title {
      font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
      color: var(--muted); margin: 0 0 0.75rem;
    }
    .status-bar { display: flex; flex-wrap: wrap; gap: 0.35rem 1.1rem; align-items: center; font-size: 0.85rem; color: var(--muted); }
    .status-bar strong { color: var(--text); font-weight: 600; }
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
      color: var(--muted); padding: 0.5rem 0.6rem; border-bottom: 1px solid var(--border);
    }
    td { padding: 0.6rem; border-bottom: 1px solid var(--border); font-size: 0.875rem; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tbody tr { transition: background .12s ease; }
    tbody tr:hover td { background: #f9fafb; }
    tr.disabled td { color: var(--muted); }
    form.inline { display: inline; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center; }
    button {
      cursor: pointer; font: inherit; font-size: 0.8rem; font-weight: 500;
      border: 1px solid var(--border); background: var(--card); color: var(--text);
      border-radius: 6px; padding: 0.35rem 0.7rem; transition: all .15s ease;
    }
    button:hover { background: #f3f4f6; border-color: #d1d5db; }
    button:active { transform: translateY(1px); }
    .btn-primary { background: var(--primary); border-color: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-dark); border-color: var(--primary-dark); }
    .danger { color: var(--danger); }
    .danger:hover { background: var(--danger-bg); border-color: var(--danger); }
    .flash {
      padding: 0.6rem 0.9rem; margin-bottom: 1rem; border-radius: var(--radius);
      font-size: 0.875rem; border: 1px solid transparent; animation: fade-in .2s ease;
    }
    .flash.ok { background: var(--ok-bg); color: #15803d; border-color: #bbf7d0; }
    .flash.error { background: var(--danger-bg); color: #b91c1c; border-color: #fecaca; }
    @keyframes fade-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
    .create-form, .edit-form, .settings form { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: end; }
    .create-form label, .edit-form label, .settings label {
      display: block; font-size: 0.72rem; font-weight: 500; color: var(--muted); margin-bottom: 0.25rem;
      text-transform: uppercase; letter-spacing: 0.03em;
    }
    input {
      font: inherit; padding: 0.4rem 0.55rem; border: 1px solid var(--border); border-radius: 6px;
      background: var(--card); color: var(--text); transition: border-color .15s ease, box-shadow .15s ease;
    }
    input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
    .edit-form input { width: 100px; }
    .edit-form input[name="user_ad_tag"] { width: 200px; }
    .settings input { min-width: 260px; }
    .hint { font-size: 0.75rem; color: var(--muted); margin: 0.4rem 0 0; flex-basis: 100%; }
    details.inline { display: inline-block; }
    details.inline > summary {
      list-style: none; cursor: pointer; display: inline-block;
      font-size: 0.8rem; font-weight: 500; border: 1px solid var(--border); border-radius: 6px;
      padding: 0.35rem 0.7rem; transition: all .15s ease;
    }
    details.inline > summary::-webkit-details-marker { display: none; }
    details.inline > summary:hover { background: #f3f4f6; border-color: #d1d5db; }
    details.inline[open] > summary { background: #eff6ff; border-color: var(--primary); color: var(--primary-dark); }
    details.inline .edit-form { margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px dashed var(--border); }
    .ok-dot, .bad-dot { display: inline-block; width: 0.55em; height: 0.55em; border-radius: 50%; }
    .ok-dot { background: var(--ok); box-shadow: 0 0 0 3px rgba(22,163,74,0.15); }
    .bad-dot { background: var(--danger); box-shadow: 0 0 0 3px rgba(239,68,68,0.15); }
    code { font-size: 0.8rem; }
    td code:not(.link) { white-space: nowrap; }
    tbody td:nth-child(4) { white-space: nowrap; }
    code.link {
      display: inline-block; cursor: pointer; max-width: 220px; overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap; word-break: normal; vertical-align: middle;
      background: #f3f4f6; border: 1px solid var(--border); border-radius: 6px;
      padding: 0.15rem 0.4rem; margin: 0.1rem 0; transition: all .15s ease;
    }
    code.link:hover { background: #eff6ff; border-color: var(--primary); color: var(--primary-dark); }
    code.link.copied { background: var(--ok-bg); border-color: var(--ok); color: #15803d; }
  </style>
</head>
<body>
  <h1>telemt users <span class="api-url">{{ api_url }}</span></h1>

  <div class="card status-bar">
    {% if ready %}
      <span>
        <span class="{{ 'ok-dot' if ready.ready else 'bad-dot' }}"></span>
        <strong>{{ ready.status }}</strong>{{ " — " + ready.reason if ready.reason else "" }}
      </span>
      <span>{{ ready.healthy_upstreams }}/{{ ready.total_upstreams }} upstreams</span>
    {% else %}
      <span><span class="bad-dot"></span> <strong>unreachable</strong></span>
    {% endif %}
    {% if health and health.read_only %}<span>read-only</span>{% endif %}
    {% if info %}<span>v{{ info.version }}</span><span>up {{ fmt_uptime(info.uptime_seconds) }}</span>{% endif %}
  </div>

  <div class="card settings">
    <div class="card-title">Connection settings</div>
    <form method="post" action="{{ url_for('settings') }}">
      <div>
        <label>Control API URL</label>
        <input name="api_url" value="{{ api_url }}" placeholder="http://127.0.0.1:9091" required>
      </div>
      <div>
        <label>Authorization header</label>
        <input name="auth_header" value="{{ auth_header }}" placeholder="Bearer ...">
      </div>
      <div>
        <label>Public proxy address</label>
        <input name="external_addr" value="{{ external_addr }}" placeholder="host:port (shown in links)">
      </div>
      <div><button type="submit" class="btn-primary">Save</button></div>
    </form>
  </div>

  {% with messages = get_flashed_messages(with_categories=True) %}
    {% for kind, msg in messages %}
      <div class="flash {{ kind }}">{{ msg }}</div>
    {% endfor %}
  {% endwith %}

  {% if error %}
    <div class="flash error">{{ error }}</div>
  {% else %}
  <div class="card">
  <table>
    <tr>
      <th>User</th><th>Status</th><th>Conns</th><th>IPs</th>
      <th>Total</th><th>Quota</th><th>Expires</th><th>Links</th><th></th>
    </tr>
    {% for u in users %}
    <tr class="{{ '' if u.enabled else 'disabled' }}">
      <td><code>{{ u.username }}</code></td>
      <td>{{ "enabled" if u.enabled else "disabled" }}</td>
      <td>{{ u.current_connections }}</td>
      <td title="active: {{ u.active_unique_ips_list|join(', ') if u.active_unique_ips_list else '—' }}
recent: {{ u.recent_unique_ips_list|join(', ') if u.recent_unique_ips_list else '—' }}">
        {{ u.active_unique_ips }}{% if u.recent_unique_ips != u.active_unique_ips %} ({{ u.recent_unique_ips }} recent){% endif %}
      </td>
      <td>{{ fmt_bytes(u.total_octets) }}</td>
      <td>
        {% if u.data_quota_bytes %}
          {{ fmt_bytes(u.total_octets) }} / {{ fmt_bytes(u.data_quota_bytes) }}
        {% else %}—{% endif %}
      </td>
      <td>{{ u.expiration_rfc3339 or "—" }}</td>
      <td>
        {% set links = (u.links.classic + u.links.secure + u.links.tls) %}
        {% if links %}
          {% for l in links %}
            {% set l = rewrite_link(l, external_addr) %}
            <code class="link" title="{{ l }} (click to copy)" onclick="copyLink(this)">{{ l }}</code>
          {% endfor %}
        {% else %}—{% endif %}
      </td>
      <td>
        <div class="actions">
        <form class="inline" method="post"
              action="{{ url_for('disable_user' if u.enabled else 'enable_user', username=u.username) }}">
          <button>{{ "Disable" if u.enabled else "Enable" }}</button>
        </form>
        <form class="inline" method="post" action="{{ url_for('rotate', username=u.username) }}">
          <button>Rotate secret</button>
        </form>
        {% if u.data_quota_bytes %}
        <form class="inline" method="post" action="{{ url_for('reset_quota', username=u.username) }}">
          <button>Reset quota</button>
        </form>
        {% endif %}
        <form class="inline" method="post" action="{{ url_for('delete_user', username=u.username) }}"
              onsubmit="return confirm('Delete {{ u.username }}?')">
          <button class="danger">Delete</button>
        </form>
        <details class="inline">
          <summary>Edit</summary>
          <form class="edit-form" method="post" action="{{ url_for('edit_user', username=u.username) }}">
            <div><label>Quota (GB)</label><input name="quota_gb" type="number" step="0.1" min="0"
                 value="{{ '%g'|format(u.data_quota_bytes / (1024**3)) if u.data_quota_bytes else '' }}"></div>
            <div><label>Max conns</label><input name="max_tcp_conns" type="number" min="1" value="{{ u.max_tcp_conns or '' }}"></div>
            <div><label>Max unique IPs</label><input name="max_unique_ips" type="number" min="1" value="{{ u.max_unique_ips or '' }}"></div>
            <div><label>Rate up (Mbps)</label><input name="rate_up_mbps" type="number" step="0.1" min="0"
                 value="{{ '%g'|format(u.rate_limit_up_bps / 1000000) if u.rate_limit_up_bps else '' }}"></div>
            <div><label>Rate down (Mbps)</label><input name="rate_down_mbps" type="number" step="0.1" min="0"
                 value="{{ '%g'|format(u.rate_limit_down_bps / 1000000) if u.rate_limit_down_bps else '' }}"></div>
            <div><label>Expires</label><input name="expires" type="date" value="{{ u.expiration_rfc3339[:10] if u.expiration_rfc3339 else '' }}"></div>
            <div><label>Ad tag</label><input name="user_ad_tag" pattern="[0-9a-fA-F]{32}" maxlength="32" value="{{ u.user_ad_tag or '' }}"></div>
            <div><label>New secret</label><input name="secret" pattern="[0-9a-fA-F]{32}" maxlength="32" placeholder="blank = keep"></div>
            <div><button type="submit" class="btn-primary">Save</button></div>
            <p class="hint">Blank field clears that override. Secret: blank keeps current.</p>
          </form>
        </details>
        </div>
      </td>
    </tr>
    {% else %}
    <tr><td colspan="9">No users configured.</td></tr>
    {% endfor %}
  </table>
  </div>
  {% endif %}

  <div class="card">
    <div class="card-title">Create user</div>
    <form class="create-form" method="post" action="{{ url_for('create_user') }}">
      <div><label>Username</label><input name="username" required pattern="[A-Za-z0-9_.\\-]+" maxlength="64"></div>
      <div><label>Secret</label><input name="secret" pattern="[0-9a-fA-F]{32}" maxlength="32" placeholder="auto-generated"></div>
      <div><label>Quota (GB)</label><input name="quota_gb" type="number" step="0.1" min="0"></div>
      <div><label>Max conns</label><input name="max_tcp_conns" type="number" min="1"></div>
      <div><label>Expires</label><input name="expires" type="date"></div>
      <div><button type="submit" class="btn-primary">New user</button></div>
    </form>
  </div>

  <script>
    function copyLink(el) {
      var text = el.textContent.trim();
      var orig = el.textContent;
      function done() {
        el.textContent = 'copied!';
        el.classList.add('copied');
        setTimeout(function () {
          el.textContent = orig;
          el.classList.remove('copied');
        }, 1000);
      }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
    }
  </script>
</body>
</html>
"""


@app.route("/")
def index():
    users, err = api("GET", "/v1/users")
    health, _ = api("GET", "/v1/health")
    ready, _ = api("GET", "/v1/health/ready")
    info, _ = api("GET", "/v1/system/info")
    return render_template_string(
        PAGE,
        users=users or [],
        error=err,
        health=health,
        ready=ready,
        info=info,
        api_url=CONFIG["api_url"],
        auth_header=CONFIG["auth_header"],
        external_addr=CONFIG["external_addr"],
        fmt_bytes=fmt_bytes,
        fmt_uptime=fmt_uptime,
        rewrite_link=rewrite_link,
    )


@app.route("/settings", methods=["POST"])
def settings():
    api_url = request.form.get("api_url", "").strip().rstrip("/")
    auth_header = request.form.get("auth_header", "").strip()
    external_addr = request.form.get("external_addr", "").strip()
    if not api_url:
        flash("Control API URL can't be empty", "error")
        return redirect(url_for("index"))

    CONFIG["api_url"] = api_url
    CONFIG["auth_header"] = auth_header
    CONFIG["external_addr"] = external_addr
    try:
        with open(CONFIG_FILE, "w") as f:
            json.dump(CONFIG, f)
        flash("Settings saved", "ok")
    except OSError as e:
        flash(f"Settings applied but not persisted: {e}", "error")
    return redirect(url_for("index"))


@app.route("/users", methods=["POST"])
def create_user():
    username = request.form["username"].strip()
    body = {"username": username}

    secret = request.form.get("secret", "").strip()
    if secret:
        body["secret"] = secret

    quota_gb = request.form.get("quota_gb", "").strip()
    if quota_gb:
        body["data_quota_bytes"] = int(float(quota_gb) * 1024**3)

    max_conns = request.form.get("max_tcp_conns", "").strip()
    if max_conns:
        body["max_tcp_conns"] = int(max_conns)

    expires = request.form.get("expires", "").strip()
    if expires:
        dt = datetime.strptime(expires, "%Y-%m-%d").replace(
            hour=23, minute=59, second=59, tzinfo=timezone.utc
        )
        body["expiration_rfc3339"] = dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    data, err = api("POST", "/v1/users", body)
    if err:
        flash(f"Couldn't create {username}: {err}", "error")
    else:
        flash(f"Created {username}, secret: {data['secret']}", "ok")
    return redirect(url_for("index"))


@app.route("/users/<username>/enable", methods=["POST"])
def enable_user(username):
    _, err = api("POST", f"/v1/users/{username}/enable")
    if err:
        flash(f"Couldn't enable {username}: {err}", "error")
    else:
        flash(f"{username} enabled", "ok")
    return redirect(url_for("index"))


@app.route("/users/<username>/disable", methods=["POST"])
def disable_user(username):
    _, err = api("POST", f"/v1/users/{username}/disable")
    if err:
        flash(f"Couldn't disable {username}: {err}", "error")
    else:
        flash(f"{username} disabled", "ok")
    return redirect(url_for("index"))


@app.route("/users/<username>/edit", methods=["POST"])
def edit_user(username):
    body = {}

    quota_gb = request.form.get("quota_gb", "").strip()
    body["data_quota_bytes"] = int(float(quota_gb) * 1024**3) if quota_gb else None

    max_conns = request.form.get("max_tcp_conns", "").strip()
    body["max_tcp_conns"] = int(max_conns) if max_conns else None

    max_ips = request.form.get("max_unique_ips", "").strip()
    body["max_unique_ips"] = int(max_ips) if max_ips else None

    rate_up = request.form.get("rate_up_mbps", "").strip()
    body["rate_limit_up_bps"] = int(float(rate_up) * 1_000_000) if rate_up else None

    rate_down = request.form.get("rate_down_mbps", "").strip()
    body["rate_limit_down_bps"] = int(float(rate_down) * 1_000_000) if rate_down else None

    expires = request.form.get("expires", "").strip()
    if expires:
        dt = datetime.strptime(expires, "%Y-%m-%d").replace(
            hour=23, minute=59, second=59, tzinfo=timezone.utc
        )
        body["expiration_rfc3339"] = dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    else:
        body["expiration_rfc3339"] = None

    ad_tag = request.form.get("user_ad_tag", "").strip()
    body["user_ad_tag"] = ad_tag or None

    secret = request.form.get("secret", "").strip()
    if secret:
        body["secret"] = secret

    _, err = api("PATCH", f"/v1/users/{username}", body)
    if err:
        flash(f"Couldn't update {username}: {err}", "error")
    else:
        flash(f"{username} updated", "ok")
    return redirect(url_for("index"))


@app.route("/users/<username>/rotate-secret", methods=["POST"])
def rotate(username):
    body = {}
    secret = request.form.get("secret", "").strip()
    if secret:
        body["secret"] = secret
    data, err = api("POST", f"/v1/users/{username}/rotate-secret", body)
    if err:
        flash(f"Couldn't rotate secret for {username}: {err}", "error")
    else:
        flash(f"New secret for {username}: {data['secret']}", "ok")
    return redirect(url_for("index"))


@app.route("/users/<username>/reset-quota", methods=["POST"])
def reset_quota(username):
    _, err = api("POST", f"/v1/users/{username}/reset-quota")
    if err:
        flash(f"Couldn't reset quota for {username}: {err}", "error")
    else:
        flash(f"Quota reset for {username}", "ok")
    return redirect(url_for("index"))


@app.route("/users/<username>/delete", methods=["POST"])
def delete_user(username):
    _, err = api("DELETE", f"/v1/users/{username}")
    if err:
        flash(f"Couldn't delete {username}: {err}", "error")
    else:
        flash(f"Deleted {username}", "ok")
    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))

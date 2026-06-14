"""Minimal web UI for managing telemt users via its Control API.

No auth, no build step — single file, stdlib + Flask only.

Config via env vars (used as defaults, overridable from the UI):
    TELEMT_API_URL     base URL of the telemt Control API (default http://127.0.0.1:9091)
    TELEMT_AUTH_HEADER value sent as the Authorization header (optional)
    TELEMT_UI_CONFIG   path to persist UI-configured settings (default ./settings.json)
"""

import json
import os
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from flask import Flask, flash, redirect, render_template_string, request, url_for

CONFIG_FILE = os.environ.get(
    "TELEMT_UI_CONFIG", os.path.join(os.path.dirname(os.path.abspath(__file__)), "settings.json")
)

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "telemt-py-ui")


def load_config():
    cfg = {
        "api_url": os.environ.get("TELEMT_API_URL", "http://127.0.0.1:9091").rstrip("/"),
        "auth_header": os.environ.get("TELEMT_AUTH_HEADER", ""),
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


PAGE = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>telemt users</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 960px; margin: 2rem auto; padding: 0 1rem; }
    h1 { font-size: 1.25rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { text-align: left; padding: 0.4rem 0.6rem; border-bottom: 1px solid #ddd; font-size: 0.9rem; }
    tr.disabled td { color: #999; }
    form.inline { display: inline; }
    button { cursor: pointer; }
    .danger { color: #b00; }
    .flash { padding: 0.5rem 0.8rem; margin: 0.5rem 0; border-radius: 4px; }
    .flash.ok { background: #e6f6e6; }
    .flash.error { background: #fde2e2; }
    .create-form { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: end; margin-top: 1rem; }
    .create-form label { display: block; font-size: 0.8rem; color: #555; }
    .create-form input { padding: 0.3rem; }
    .settings { margin-top: 1rem; }
    .settings form { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: end; margin-top: 0.5rem; }
    .settings label { display: block; font-size: 0.8rem; color: #555; }
    .settings input { padding: 0.3rem; min-width: 260px; }
    code { font-size: 0.8rem; word-break: break-all; }
    code.link { display: block; cursor: pointer; max-width: 220px; overflow: hidden;
                 text-overflow: ellipsis; white-space: nowrap; word-break: normal; }
    code.link.copied { color: #0a0; }
  </style>
</head>
<body>
  <h1>telemt users — {{ api_url }}</h1>

  <details class="settings">
    <summary>telemt connection settings</summary>
    <form method="post" action="{{ url_for('settings') }}">
      <div>
        <label>Control API URL</label>
        <input name="api_url" value="{{ api_url }}" placeholder="http://127.0.0.1:9091" required>
      </div>
      <div>
        <label>Authorization header</label>
        <input name="auth_header" value="{{ auth_header }}" placeholder="Bearer ...">
      </div>
      <div><button type="submit">Save</button></div>
    </form>
  </details>

  {% with messages = get_flashed_messages(with_categories=True) %}
    {% for kind, msg in messages %}
      <div class="flash {{ kind }}">{{ msg }}</div>
    {% endfor %}
  {% endwith %}

  {% if error %}
    <div class="flash error">{{ error }}</div>
  {% else %}
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
      <td>{{ u.active_unique_ips }}</td>
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
            <code class="link" title="{{ l }} (click to copy)" onclick="copyLink(this)">{{ l }}</code>
          {% endfor %}
        {% else %}—{% endif %}
      </td>
      <td>
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
      </td>
    </tr>
    {% else %}
    <tr><td colspan="9">No users configured.</td></tr>
    {% endfor %}
  </table>
  {% endif %}

  <form class="create-form" method="post" action="{{ url_for('create_user') }}">
    <div><label>Username</label><input name="username" required pattern="[A-Za-z0-9_.\\-]+" maxlength="64"></div>
    <div><label>Quota (GB)</label><input name="quota_gb" type="number" step="0.1" min="0"></div>
    <div><label>Max conns</label><input name="max_tcp_conns" type="number" min="1"></div>
    <div><label>Expires</label><input name="expires" type="date"></div>
    <div><button type="submit">New user</button></div>
  </form>

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
    return render_template_string(
        PAGE,
        users=users or [],
        error=err,
        api_url=CONFIG["api_url"],
        auth_header=CONFIG["auth_header"],
        fmt_bytes=fmt_bytes,
    )


@app.route("/settings", methods=["POST"])
def settings():
    api_url = request.form.get("api_url", "").strip().rstrip("/")
    auth_header = request.form.get("auth_header", "").strip()
    if not api_url:
        flash("Control API URL can't be empty", "error")
        return redirect(url_for("index"))

    CONFIG["api_url"] = api_url
    CONFIG["auth_header"] = auth_header
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


@app.route("/users/<username>/rotate-secret", methods=["POST"])
def rotate(username):
    data, err = api("POST", f"/v1/users/{username}/rotate-secret", {})
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

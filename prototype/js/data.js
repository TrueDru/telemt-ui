// data.js — mock control-plane data for Telemt admin UI.
// Plain JS (no JSX). Exposes window.TM with data + formatting helpers.
(function () {
  // ---- formatting helpers -------------------------------------------------
  function fmtBytes(n) {
    if (n == null) return "—";
    if (n === 0) return "0 B";
    const u = ["B", "KB", "MB", "GB", "TB", "PB"];
    const i = Math.floor(Math.log(n) / Math.log(1024));
    const v = n / Math.pow(1024, i);
    return (v >= 100 || i === 0 ? v.toFixed(0) : v.toFixed(v >= 10 ? 1 : 2)) + " " + u[i];
  }
  function fmtBps(n) {
    if (n == null || n === 0) return "—";
    const u = ["bps", "Kbps", "Mbps", "Gbps"];
    const i = Math.floor(Math.log(n) / Math.log(1000));
    const v = n / Math.pow(1000, i);
    return (v >= 100 ? v.toFixed(0) : v.toFixed(1)) + " " + u[i];
  }
  function fmtNum(n) {
    if (n == null) return "—";
    return n.toLocaleString("en-US");
  }
  function fmtUptime(sec) {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (d > 0) return d + "d " + h + "h";
    if (h > 0) return h + "h " + m + "m";
    return m + "m";
  }
  function relTime(ts) {
    const diff = (Date.now() - ts) / 1000;
    if (diff < 5) return "just now";
    if (diff < 60) return Math.floor(diff) + "s ago";
    if (diff < 3600) return Math.floor(diff / 60) + "m ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    return Math.floor(diff / 86400) + "d ago";
  }
  function relFuture(ts) {
    const diff = (ts - Date.now()) / 1000;
    if (diff < 0) return "expired";
    if (diff < 3600) return "in " + Math.floor(diff / 60) + "m";
    if (diff < 86400) return "in " + Math.floor(diff / 3600) + "h";
    const d = Math.floor(diff / 86400);
    if (d < 60) return "in " + d + "d";
    return "in " + Math.floor(d / 30) + "mo";
  }
  function fmtDate(ts) {
    if (!ts) return "never";
    const d = new Date(ts);
    return d.toISOString().slice(0, 16).replace("T", " ") + "Z";
  }

  // deterministic pseudo-random sparkline series
  function spark(seed, len, base, amp) {
    const out = [];
    let x = seed;
    for (let i = 0; i < len; i++) {
      x = (x * 9301 + 49297) % 233280;
      const r = x / 233280;
      out.push(Math.max(0, base + Math.sin(i / 2.3 + seed) * amp * 0.5 + (r - 0.5) * amp));
    }
    return out;
  }

  const SECRET = () =>
    Array.from({ length: 32 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");

  // ---- instances / nodes --------------------------------------------------
  const nodes = [
    { id: "fra-1", name: "fra-edge-01", region: "Frankfurt · DE", host: "185.203.x.11", health: "healthy", users: 142, conns: 3187, ver: "0.9.4" },
    { id: "ams-1", name: "ams-edge-02", region: "Amsterdam · NL", host: "51.158.x.74", health: "healthy", users: 98, conns: 2044, ver: "0.9.4" },
    { id: "sgp-1", name: "sgp-edge-01", region: "Singapore · SG", host: "139.162.x.9", health: "degraded", users: 61, conns: 1190, ver: "0.9.3" },
    { id: "iad-1", name: "iad-edge-03", region: "Ashburn · US", host: "66.42.x.220", health: "down", users: 0, conns: 0, ver: "0.9.4" },
  ];

  // ---- dashboard ----------------------------------------------------------
  const dashboard = {
    uptimeSec: 19 * 86400 + 7 * 3600 + 42 * 60,
    connectionsTotal: 3187,
    connectionsSpark: spark(7, 40, 2800, 900),
    usersConfigured: 142,
    usersActive: 88,
    readOnly: false,
    routeMode: "direct+upstream",
    bandwidthUpSpark: spark(13, 40, 120, 60),
    bandwidthDownSpark: spark(21, 40, 380, 140),
    gates: [
      { key: "admission_open", label: "Admission", state: "open", desc: "New connections accepted" },
      { key: "me_ready", label: "ME pool ready", state: "open", desc: "Middle-proxy pool generation healthy" },
      { key: "dc_coverage", label: "DC coverage", state: "open", desc: "All 5 datacenters reachable" },
      { key: "upstream_health", label: "Upstreams", state: "warn", desc: "1 of 3 upstreams degraded" },
      { key: "fake_tls", label: "FakeTLS", state: "open", desc: "Domain fronting active" },
      { key: "rate_guard", label: "Rate guard", state: "open", desc: "Per-IP limiter nominal" },
      { key: "replay_cache", label: "Replay cache", state: "open", desc: "Anti-replay window warm" },
      { key: "nat_reflect", label: "NAT reflection", state: "warn", desc: "STUN partial — see Runtime" },
    ],
  };

  // ---- users --------------------------------------------------------------
  const firstNames = ["atlas", "nova", "kestrel", "umbra", "vega", "cobalt", "lyra", "onyx", "pike", "quartz", "raven", "sable", "tundra", "wisp", "zephyr", "marlin", "drift", "ember", "flint", "harbor"];
  const adTags = ["", "campaign_eu", "reseller_a", "", "vip", "", "campaign_eu", "", "reseller_b", ""];
  function mkUser(i) {
    const name = firstNames[i % firstNames.length] + (i >= firstNames.length ? "_" + Math.floor(i / firstNames.length) : "");
    const enabled = i % 9 !== 4;
    const conns = enabled ? Math.floor(Math.abs(Math.sin(i * 2.7)) * 64) : 0;
    const ips = enabled ? Math.max(1, Math.floor(conns / 3) + (i % 4)) : 0;
    const octets = Math.floor(Math.abs(Math.sin(i * 1.3)) * 9e11) + i * 1e8;
    const hasQuota = i % 3 === 0;
    const quota = hasQuota ? [50e9, 100e9, 250e9, 500e9, 1e12][i % 5] : null;
    const used = hasQuota ? Math.min(quota, octets) : null;
    const exp = i % 5 === 0 ? null : Date.now() + (i % 7 === 2 ? -2 : 1) * (3 + (i % 40)) * 86400000;
    return {
      id: "u" + i,
      username: name,
      enabled,
      conns,
      ips,
      octets,
      quota,
      used,
      expiration: exp,
      maxTcpConns: [0, 16, 32, 64][i % 4] || null,
      rateUp: i % 4 === 1 ? 10e6 : null,
      rateDown: i % 4 === 1 ? 50e6 : null,
      maxUniqueIps: i % 3 === 1 ? 4 : null,
      adTag: adTags[i % adTags.length],
      secret: "ee" + SECRET(),
      created: Date.now() - (i + 3) * 86400000 * 2,
      sparkUp: spark(i + 2, 24, 8, 6),
      sparkDown: spark(i + 11, 24, 28, 20),
    };
  }
  const users = Array.from({ length: 42 }, (_, i) => mkUser(i));

  const proxyModes = [
    { mode: "Direct (ee-secret)", domain: null },
    { mode: "FakeTLS · google.com", domain: "google.com" },
    { mode: "FakeTLS · cloudflare.com", domain: "cloudflare.com" },
  ];

  // ---- config -------------------------------------------------------------
  const config = {
    general: {
      _label: "General",
      _restart: true,
      modes: { type: "multiselect", value: ["direct", "faketls"], options: ["direct", "faketls", "secure"], label: "Enabled modes", restart: true },
      port: { type: "number", value: 443, label: "Listen port", restart: true },
      tag: { type: "text", value: "telemt-fra-01", label: "Server tag" },
      stats_secret: { type: "secret", value: "9f2c…a417", label: "Stats endpoint secret" },
      read_only: { type: "toggle", value: false, label: "Read-only mode", desc: "Reject all mutating control-API calls" },
    },
    timeouts: {
      _label: "Timeouts",
      _restart: true,
      handshake_ms: { type: "number", value: 8000, label: "Handshake timeout", unit: "ms", restart: true },
      idle_s: { type: "number", value: 120, label: "Idle connection", unit: "s", restart: true },
      upstream_dial_ms: { type: "number", value: 4000, label: "Upstream dial", unit: "ms", restart: true },
      ack_window_ms: { type: "number", value: 250, label: "Ack window", unit: "ms" },
    },
    censorship: {
      _label: "Censorship",
      _restart: true,
      faketls_domains: { type: "array", value: ["google.com", "cloudflare.com", "www.microsoft.com"], label: "FakeTLS domains", restart: true },
      block_cidrs: { type: "array", value: ["10.0.0.0/8", "192.168.0.0/16", "100.64.0.0/10"], label: "Blocked CIDRs", restart: true },
      probe_action: { type: "select", value: "drain", options: ["reset", "drain", "tarpit"], label: "On active probe", restart: true },
      replay_window_s: { type: "number", value: 90, label: "Replay window", unit: "s", restart: true },
    },
    upstreams: {
      _label: "Upstreams",
      _restart: true,
      pool: { type: "array", value: ["149.154.175.50:443", "149.154.167.51:443", "91.108.56.130:443"], label: "Upstream pool", restart: true },
      strategy: { type: "select", value: "rtt-weighted", options: ["round-robin", "rtt-weighted", "least-conn"], label: "Balance strategy", restart: true },
      max_per_upstream: { type: "number", value: 4000, label: "Max conns / upstream", restart: true },
    },
    show_link: {
      _label: "Share links",
      _restart: false,
      enabled: { type: "toggle", value: true, label: "Expose tg:// links in API" },
      public_host: { type: "text", value: "fra-edge-01.telemt.net", label: "Public hostname" },
      include_secret: { type: "toggle", value: true, label: "Embed per-user secret" },
    },
    dc_overrides: {
      _label: "DC overrides",
      _restart: false,
      "dc2_ip": { type: "text", value: "149.154.167.51", label: "DC2 override IP" },
      "dc4_ip": { type: "text", value: "149.154.167.91", label: "DC4 override IP" },
      prefer_ipv6: { type: "toggle", value: false, label: "Prefer IPv6 to DCs" },
    },
  };

  // ---- runtime / diagnostics ---------------------------------------------
  const runtime = {
    dcs: [
      { dc: "DC1", region: "MIA", rtt: 38, coverage: 100, writers: 6, floor: [4, 6, 12] },
      { dc: "DC2", region: "AMS", rtt: 12, coverage: 100, writers: 8, floor: [4, 8, 16] },
      { dc: "DC3", region: "MIA", rtt: 41, coverage: 96, writers: 5, floor: [4, 6, 12] },
      { dc: "DC4", region: "AMS", rtt: 14, coverage: 100, writers: 8, floor: [4, 8, 16] },
      { dc: "DC5", region: "SGP", rtt: 122, coverage: 72, writers: 3, floor: [2, 4, 10] },
    ],
    mePool: {
      enabled: true,
      generation: 5142,
      lastSwap: Date.now() - 1000 * 60 * 7,
      hardswap: false,
      events: [
        { gen: 5142, kind: "soft", ts: Date.now() - 1000 * 60 * 7 },
        { gen: 5141, kind: "soft", ts: Date.now() - 1000 * 60 * 64 },
        { gen: 5140, kind: "hard", ts: Date.now() - 1000 * 60 * 188 },
        { gen: 5139, kind: "soft", ts: Date.now() - 1000 * 60 * 240 },
        { gen: 5138, kind: "soft", ts: Date.now() - 1000 * 60 * 305 },
      ],
    },
    upstreams: [
      { addr: "149.154.175.50:443", state: "healthy", rtt: 22, conns: 1840, fails: 0 },
      { addr: "149.154.167.51:443", state: "healthy", rtt: 18, conns: 1622, fails: 1 },
      { addr: "91.108.56.130:443", state: "degraded", rtt: 144, conns: 410, fails: 37 },
    ],
    nat: {
      enabled: true,
      type: "Port-restricted cone",
      reflection: "partial",
      mappedIp: "185.203.x.11",
      mappedPort: 443,
      stunServers: 3,
      stunOk: 2,
    },
  };

  // ---- fingerprints (JA3/JA4) --------------------------------------------
  const fpHashes = ["771,4865-4866-4867,0-23-65281", "e7d705a3286e19ea42f587b344ee6865", "t13d1516h2_8daaf6152771_b186095e22c6", "769,47-53-5-10-49161", "1d09d3c2b6a4f7e8", "cd08e31494f9531f560d64c695473da9", "a0e9f5d64349fb13191bc781f81f42e1", "0f3a8c11e6d24b97"];
  const fpKinds = ["JA3", "JA3", "JA4", "JA3", "JA4", "JA3", "JA3", "JA4"];
  const fpClients = ["Telegram Desktop", "Telegram Android", "Telegram iOS", "Chrome 124", "curl/probe", "Unknown", "Telegram macOS", "Go-http-client"];
  function mkFp(i) {
    const total = Math.floor(Math.abs(Math.sin(i * 1.9)) * 9000) + 120;
    const bad = i % 4 === 0 ? Math.floor(total * (0.3 + (i % 3) * 0.2)) : Math.floor(total * 0.02);
    return {
      id: "fp" + i,
      kind: fpKinds[i % fpKinds.length],
      hash: fpHashes[i % fpHashes.length],
      client: fpClients[i % fpClients.length],
      total,
      auth: total - bad,
      bad,
      ip: ["185.203.118.4", "51.158.74.9", "139.162.9.211", "66.42.220.18", "203.0.113.77"][i % 5],
      cidr: ["185.203.118.0/24", "51.158.0.0/16", "139.162.0.0/16", "66.42.220.0/24", "203.0.113.0/24"][i % 5],
      user: i % 3 === 0 ? users[i % users.length].username : "—",
      first: Date.now() - (3 + i) * 3600000,
      last: Date.now() - (i % 6) * 600000 - 30000,
    };
  }
  const fingerprints = Array.from({ length: 18 }, (_, i) => mkFp(i));

  // ---- events -------------------------------------------------------------
  const eventTypes = [
    { t: "user.connect", sev: "info" },
    { t: "user.quota_warn", sev: "warn" },
    { t: "upstream.degraded", sev: "warn" },
    { t: "me.softswap", sev: "info" },
    { t: "probe.detected", sev: "warn" },
    { t: "config.applied", sev: "info" },
    { t: "user.expired", sev: "warn" },
    { t: "auth.bad_secret", sev: "error" },
    { t: "node.reconnect", sev: "info" },
    { t: "rate.throttled", sev: "warn" },
  ];
  const events = Array.from({ length: 14 }, (_, i) => {
    const e = eventTypes[i % eventTypes.length];
    const u = users[(i * 5) % users.length];
    return {
      id: "e" + i,
      type: e.t,
      sev: e.sev,
      ts: Date.now() - i * (40000 + (i % 5) * 23000),
      detail:
        e.t.startsWith("user") ? "user " + u.username :
        e.t.startsWith("upstream") ? "91.108.56.130:443 rtt 144ms" :
        e.t.startsWith("me") ? "generation 5142" :
        e.t.startsWith("probe") ? "from 203.0.113.77" :
        e.t.startsWith("auth") ? "from 198.51.100.23" :
        e.t.startsWith("config") ? "section: censorship" :
        e.t.startsWith("rate") ? "user " + u.username : "node sgp-edge-01",
    };
  });

  window.TM = {
    fmtBytes, fmtBps, fmtNum, fmtUptime, relTime, relFuture, fmtDate, spark, SECRET,
    nodes, dashboard, users, proxyModes, config, runtime, fingerprints, events,
  };
})();

// fingerprints.jsx — JA3/JA4 leaderboard with by-fingerprint/IP/CIDR/user tabs.
(function () {
  const { useState, useMemo } = React;
  const Icon = window.Icon;
  const { Card, Badge, Button, Tabs, CopyButton } = window;
  const TM = window.TM;

  function Ratio({ auth, bad, total }) {
    const authPct = (auth / total) * 100;
    return (
      <div className="ratio-cell">
        <div className="ratio-bar bar" style={{ height: 5 }}>
          <div style={{ display: "flex", height: "100%", width: "100%" }}>
            <div style={{ width: authPct + "%", background: "var(--ok)" }} />
            <div style={{ width: (100 - authPct) + "%", background: bad > total * 0.1 ? "var(--err)" : "var(--warn)" }} />
          </div>
        </div>
        <span className="tnum muted" style={{ fontSize: 11, width: 34 }}>{Math.round(authPct)}%</span>
      </div>
    );
  }

  function Fingerprints() {
    const [tab, setTab] = useState("fp");
    const [sort, setSort] = useState({ key: "total", dir: "desc" });
    const [q, setQ] = useState("");

    const tabs = [
      { key: "fp", label: "By fingerprint", count: TM.fingerprints.length },
      { key: "ip", label: "By IP", count: 5 },
      { key: "cidr", label: "By CIDR", count: 5 },
      { key: "user", label: "By user", count: new Set(TM.fingerprints.map((f) => f.user)).size },
    ];

    // aggregate by the active dimension
    const grouped = useMemo(() => {
      const keyOf = { fp: "hash", ip: "ip", cidr: "cidr", user: "user" }[tab];
      const map = {};
      TM.fingerprints.forEach((f) => {
        const k = f[keyOf];
        if (!map[k]) map[k] = { key: k, kind: f.kind, client: f.client, total: 0, auth: 0, bad: 0, first: f.first, last: f.last, sample: f };
        const g = map[k];
        g.total += f.total; g.auth += f.auth; g.bad += f.bad;
        g.first = Math.min(g.first, f.first); g.last = Math.max(g.last, f.last);
      });
      let arr = Object.values(map);
      if (q) arr = arr.filter((g) => String(g.key).toLowerCase().includes(q.toLowerCase()) || g.client.toLowerCase().includes(q.toLowerCase()));
      const dir = sort.dir === "asc" ? 1 : -1;
      arr.sort((a, b) => typeof a[sort.key] === "string" ? a[sort.key].localeCompare(b[sort.key]) * dir : (a[sort.key] - b[sort.key]) * dir);
      return arr;
    }, [tab, sort, q]);

    const toggleSort = (k) => setSort((s) => s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "desc" });
    const SortTh = ({ k, children, num }) => (
      <th className={(num ? "num " : "") + "sortable"} style={{ paddingTop: 14 }} onClick={() => toggleSort(k)}>
        {children}{sort.key === k && <span className="sort-ic">{sort.dir === "asc" ? <Icon.arrowUp size={11} /> : <Icon.arrowDown size={11} />}</span>}
      </th>
    );

    const keyLabel = { fp: "Fingerprint", ip: "IP address", cidr: "CIDR block", user: "User" }[tab];
    const totalProbes = TM.fingerprints.reduce((s, f) => s + f.bad, 0);

    return (
      <div>
        <div className="page-head">
          <div>
            <h1 className="page-title">Security · TLS fingerprints</h1>
            <div className="page-desc">JA3/JA4 client fingerprints observed at the handshake layer. <b style={{ color: "var(--warn)" }}>{TM.fmtNum(totalProbes)}</b> bad/probe attempts in the last hour.</div>
          </div>
          <div className="page-actions">
            <Button variant="default" icon={<Icon.download size={14} />}>Export CSV</Button>
            <Button variant="default" icon={<Icon.filter size={14} />}>Block rule</Button>
          </div>
        </div>

        <div className="row" style={{ justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <Tabs tabs={tabs} value={tab} onChange={setTab} />
          <div className="topbar-search" style={{ width: 240 }}>
            <Icon.search size={14} />
            <input placeholder={"Filter " + keyLabel.toLowerCase() + "…"} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        <Card pad={false}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr>
                <th style={{ paddingLeft: 16, paddingTop: 14 }}>{keyLabel}</th>
                {tab === "fp" && <th style={{ paddingTop: 14 }}>Client</th>}
                <SortTh k="total" num>Total</SortTh>
                <SortTh k="auth" num>Auth OK</SortTh>
                <SortTh k="bad" num>Bad / probe</SortTh>
                <th style={{ width: 130, paddingTop: 14 }}>Success</th>
                <SortTh k="first">First seen</SortTh>
                <SortTh k="last">Last seen</SortTh>
              </tr></thead>
              <tbody>
                {grouped.map((g) => {
                  const flagged = g.bad > g.total * 0.1;
                  return (
                    <tr key={g.key}>
                      <td style={{ paddingLeft: 16 }}>
                        <div className="row" style={{ gap: 8 }}>
                          {tab === "fp" && <Badge tone="outline" size="sm">{g.kind}</Badge>}
                          <span className="fp-hash" title={String(g.key)}>{g.key}</span>
                          {flagged && <Badge tone="err" size="sm" dot>flagged</Badge>}
                        </div>
                      </td>
                      {tab === "fp" && <td className="muted">{g.client}</td>}
                      <td className="num tnum">{TM.fmtNum(g.total)}</td>
                      <td className="num tnum" style={{ color: "var(--ok)" }}>{TM.fmtNum(g.auth)}</td>
                      <td className="num tnum" style={{ color: g.bad > 0 ? (flagged ? "var(--err)" : "var(--warn)") : "var(--muted)" }}>{TM.fmtNum(g.bad)}</td>
                      <td><Ratio auth={g.auth} bad={g.bad} total={g.total} /></td>
                      <td className="muted nowrap">{TM.relTime(g.first)}</td>
                      <td className="nowrap">{TM.relTime(g.last)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  window.Fingerprints = Fingerprints;
})();

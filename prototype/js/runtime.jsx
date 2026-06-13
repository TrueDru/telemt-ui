// runtime.jsx — diagnostics: per-DC table, ME pool timeline, upstream health, NAT card.
(function () {
  const { useState } = React;
  const Icon = window.Icon;
  const { Card, Badge, Button, Bar, StatusDot, Tabs, EmptyState, KV } = window;
  const TM = window.TM;

  function DisabledPanel({ reason }) {
    const map = {
      feature_disabled: { title: "Feature disabled", desc: "This diagnostic is turned off in config. Enable it under the relevant section to start collecting data." },
      source_unavailable: { title: "Source unavailable", desc: "The data source for this panel isn't reporting on this node right now. Nothing is wrong — there's simply no data to show." },
    };
    const m = map[reason] || map.feature_disabled;
    return <EmptyState icon={<Icon.moon size={22} />} title={m.title} desc={m.desc} reason={reason} />;
  }

  function DCTable() {
    return (
      <Card pad={false}>
        <div className="card-head" style={{ padding: "16px 16px 0" }}>
          <div className="card-title"><Icon.globe size={15} style={{ color: "var(--accent)" }} />Per-datacenter coverage</div>
          <Badge tone="ok" size="sm">5 DCs reachable</Badge>
        </div>
        <div className="tbl-wrap" style={{ marginTop: 12 }}>
          <table className="tbl">
            <thead><tr>
              <th style={{ paddingLeft: 16 }}>DC</th><th>Region</th><th className="num">RTT</th>
              <th style={{ width: 170 }}>Coverage</th><th className="num">Writers</th><th>Floor min/target/max</th>
            </tr></thead>
            <tbody>
              {TM.runtime.dcs.map((d) => {
                const cc = d.coverage >= 95 ? "var(--ok)" : d.coverage >= 80 ? "var(--warn)" : "var(--err)";
                return (
                  <tr key={d.dc}>
                    <td style={{ paddingLeft: 16 }}><span className="mono" style={{ fontWeight: 600 }}>{d.dc}</span></td>
                    <td className="muted mono">{d.region}</td>
                    <td className="num tnum"><span style={{ color: d.rtt > 100 ? "var(--warn)" : undefined }}>{d.rtt} ms</span></td>
                    <td>
                      <div className="cov-cell">
                        <div className="cov-bar"><Bar value={d.coverage} color={cc} h={6} /></div>
                        <span className="cov-val" style={{ color: cc }}>{d.coverage}%</span>
                      </div>
                    </td>
                    <td className="num tnum">{d.writers}</td>
                    <td><span className="floor"><span>{d.floor[0]}</span><span>/</span><b>{d.floor[1]}</b><span>/</span><span>{d.floor[2]}</span></span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  function MEPool() {
    const m = TM.runtime.mePool;
    return (
      <Card>
        <div className="card-head">
          <div className="card-title"><Icon.refresh size={15} style={{ color: "var(--accent)" }} />ME pool</div>
          <Badge tone={m.hardswap ? "warn" : "ok"} dot size="sm">gen {m.generation}</Badge>
        </div>
        {m.enabled ? (
          <>
            <div className="row" style={{ gap: 0, justifyContent: "space-between", marginBottom: 14 }}>
              <div><div className="muted" style={{ fontSize: 11 }}>Generation</div><div className="mono" style={{ fontWeight: 600, fontSize: 17 }}>{m.generation}</div></div>
              <div><div className="muted" style={{ fontSize: 11 }}>Last swap</div><div style={{ fontWeight: 550, fontSize: 13, marginTop: 3 }}>{TM.relTime(m.lastSwap)}</div></div>
              <div><div className="muted" style={{ fontSize: 11 }}>Hardswap</div><div style={{ marginTop: 3 }}><Badge tone={m.hardswap ? "warn" : "neutral"} size="sm">{m.hardswap ? "active" : "idle"}</Badge></div></div>
            </div>
            <div className="section-label">Swap history</div>
            <div className="timeline">
              {m.events.map((e, i) => (
                <div key={i} className="tl-item">
                  <span className="tl-node" style={{ background: e.kind === "hard" ? "var(--warn)" : "var(--accent)" }} />
                  <div className="tl-meta">
                    <span className="tl-gen mono">gen {e.gen}</span>
                    <Badge tone={e.kind === "hard" ? "warn" : "neutral"} size="sm">{e.kind}swap</Badge>
                    <span className="tl-time" style={{ marginLeft: "auto" }}>{TM.relTime(e.ts)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : <DisabledPanel reason="feature_disabled" />}
      </Card>
    );
  }

  function Upstreams() {
    return (
      <Card pad={false}>
        <div className="card-head" style={{ padding: "16px 16px 0" }}>
          <div className="card-title"><Icon.server size={15} style={{ color: "var(--accent)" }} />Upstream health</div>
        </div>
        <div className="tbl-wrap" style={{ marginTop: 12 }}>
          <table className="tbl">
            <thead><tr><th style={{ paddingLeft: 16 }}>Upstream</th><th>State</th><th className="num">RTT</th><th className="num">Conns</th><th className="num">Fails</th></tr></thead>
            <tbody>
              {TM.runtime.upstreams.map((u) => (
                <tr key={u.addr}>
                  <td style={{ paddingLeft: 16 }} className="mono">{u.addr}</td>
                  <td><span className="row" style={{ gap: 7 }}><StatusDot state={u.state} />{u.state}</span></td>
                  <td className="num tnum"><span style={{ color: u.rtt > 100 ? "var(--warn)" : undefined }}>{u.rtt} ms</span></td>
                  <td className="num tnum">{TM.fmtNum(u.conns)}</td>
                  <td className="num tnum"><span style={{ color: u.fails > 10 ? "var(--err)" : "var(--muted)" }}>{u.fails}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  function NATCard() {
    const n = TM.runtime.nat;
    return (
      <Card>
        <div className="card-head">
          <div className="card-title"><Icon.globe size={15} style={{ color: "var(--accent)" }} />NAT / STUN reflection</div>
          <Badge tone={n.reflection === "full" ? "ok" : n.reflection === "partial" ? "warn" : "err"} dot size="sm">{n.reflection}</Badge>
        </div>
        {n.enabled ? (
          <div className="col" style={{ gap: 0 }}>
            <KV k="NAT type">{n.type}</KV>
            <KV k="Mapped address" mono>{n.mappedIp}:{n.mappedPort}</KV>
            <KV k="STUN servers">{n.stunOk} / {n.stunServers} responding</KV>
            <KV k="Reflection"><Badge tone={n.reflection === "partial" ? "warn" : "ok"} size="sm">{n.reflection}</Badge></KV>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 12, lineHeight: 1.5 }}>One STUN server timed out. Reflection is partial but the mapped endpoint is stable — proxy reachability is unaffected.</div>
          </div>
        ) : <DisabledPanel reason="source_unavailable" />}
      </Card>
    );
  }

  function Runtime() {
    const [tab, setTab] = useState("coverage");
    const tabs = [
      { key: "coverage", label: "DC coverage", icon: <Icon.globe size={14} /> },
      { key: "mepool", label: "ME pool", icon: <Icon.refresh size={14} /> },
      { key: "upstreams", label: "Upstreams", icon: <Icon.server size={14} /> },
      { key: "nat", label: "NAT / STUN", icon: <Icon.activity size={14} /> },
    ];
    return (
      <div>
        <div className="page-head">
          <div>
            <h1 className="page-title">Runtime</h1>
            <div className="page-desc">Live diagnostics from the proxy's internal telemetry.</div>
          </div>
          <div className="page-actions"><Button variant="default" icon={<Icon.refresh size={14} />}>Refresh</Button></div>
        </div>
        <div style={{ marginBottom: 16 }}><Tabs tabs={tabs} value={tab} onChange={setTab} /></div>

        {tab === "coverage" && <div className="col" style={{ gap: 14 }}><DCTable /><div className="grid-2"><MEPool /><NATCard /></div></div>}
        {tab === "mepool" && <div className="grid-2"><MEPool /><NATCard /></div>}
        {tab === "upstreams" && <Upstreams />}
        {tab === "nat" && <div className="grid-2"><NATCard />
          <Card><div className="card-head"><div className="card-title"><Icon.filter size={15} style={{ color: "var(--accent)" }} />Reflection log</div></div>
            <DisabledPanel reason="source_unavailable" /></Card></div>}
      </div>
    );
  }

  window.Runtime = Runtime;
})();

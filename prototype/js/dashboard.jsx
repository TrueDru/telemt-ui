// dashboard.jsx — overview surface: stat cards, gates panel, events ticker.
(function () {
  const { useState, useEffect, useRef } = React;
  const Icon = window.Icon;
  const { Card, Sparkline, StatusDot, Badge, Button, EmptyState } = window;
  const TM = window.TM;

  function StatCard({ label, icon, value, unit, spark, delta, sparkColor, foot }) {
    return (
      <Card className="stat">
        <div className="stat-label">{icon}{label}</div>
        <div className="stat-value tnum">{value}{unit && <span className="unit">{unit}</span>}</div>
        <div className="stat-foot">
          {delta ? <span className={"stat-delta " + (delta.dir)}>
            {delta.dir === "up" ? <Icon.arrowUp size={12} /> : <Icon.arrowDown size={12} />}{delta.text}
          </span> : foot ? <span className="muted" style={{ fontSize: 11.5 }}>{foot}</span> : <span />}
        </div>
        {spark && <div className="stat-spark"><Sparkline data={spark} color={sparkColor || "var(--accent)"} w={92} h={30} /></div>}
      </Card>
    );
  }

  function Gate({ g }) {
    return (
      <div className="gate" title={g.desc}>
        <StatusDot state={g.state} pulse />
        <div className="gate-body">
          <div className="gate-label">{g.label}</div>
          <div className="gate-desc">{g.desc}</div>
        </div>
      </div>
    );
  }

  function EventRow({ e }) {
    const c = e.sev === "error" ? "var(--err)" : e.sev === "warn" ? "var(--warn)" : "var(--accent)";
    return (
      <div className="event-row">
        <span className="event-sev" style={{ background: c }} />
        <span className="event-type mono">{e.type}</span>
        <span className="event-detail">{e.detail}</span>
        <span className="event-time">{TM.relTime(e.ts)}</span>
      </div>
    );
  }

  function Dashboard({ node }) {
    const d = TM.dashboard;
    const [tick, setTick] = useState(0);
    useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 5000); return () => clearInterval(t); }, []);
    const openGates = d.gates.filter((g) => g.state === "open").length;

    const offline = node && node.health === "down";

    return (
      <div>
        <div className="page-head">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <div className="page-desc">Live overview of <b style={{ color: "var(--text-2)" }}>{node ? node.name : "fra-edge-01"}</b> · refreshed {TM.relTime(Date.now() - tick * 0)}</div>
          </div>
          <div className="page-actions">
            <Badge tone={d.readOnly ? "warn" : "ok"} dot>{d.readOnly ? "Read-only" : "Read-write"}</Badge>
            <Button variant="default" icon={<Icon.refresh size={14} />}>Refresh</Button>
          </div>
        </div>

        {offline && (
          <Card className="card-pad" style={{ borderColor: "var(--err)", marginBottom: 14, background: "var(--err-soft)" }}>
            <div className="row"><Icon.alert size={16} style={{ color: "var(--err)" }} /><b>Node unreachable.</b><span className="muted">Last control-plane contact 6m ago. Showing last-known state.</span></div>
          </Card>
        )}

        {/* stat cards */}
        <div className="stat-grid">
          <StatCard label="Uptime" icon={<Icon.clock size={13} />} value={TM.fmtUptime(d.uptimeSec)} foot="since deploy · v0.9.4" />
          <StatCard label="Connections" icon={<Icon.activity size={13} />} value={TM.fmtNum(offline ? 0 : d.connectionsTotal)} spark={d.connectionsSpark} delta={{ dir: "up", text: "+8.2%" }} />
          <StatCard label="Configured users" icon={<Icon.users size={13} />} value={TM.fmtNum(d.usersConfigured)} foot={d.usersActive + " active now"} />
          <StatCard label="Throughput ↓" icon={<Icon.arrowDown size={13} />} value="382" unit="Mbps" spark={d.bandwidthDownSpark} sparkColor="var(--ok)" delta={{ dir: "up", text: "+3.1%" }} />
          <StatCard label="Route mode" icon={<Icon.globe size={13} />} value={<span style={{ fontSize: 17 }} className="mono">{d.routeMode}</span>} foot="direct + 3 upstreams" />
        </div>

        <div className="grid-3 mt-md">
          {/* gates */}
          <Card>
            <div className="card-head">
              <div className="card-title"><Icon.shield size={15} style={{ color: "var(--accent)" }} />Admission &amp; readiness gates</div>
              <Badge tone={openGates === d.gates.length ? "ok" : "warn"} size="sm">{openGates}/{d.gates.length} open</Badge>
            </div>
            <div className="gates-grid">
              {d.gates.map((g) => <Gate key={g.key} g={g} />)}
            </div>
          </Card>

          {/* events ticker */}
          <Card>
            <div className="card-head">
              <div className="card-title"><Icon.pulse size={15} style={{ color: "var(--accent)" }} />Recent events</div>
              <a className="muted" style={{ fontSize: 11.5, cursor: "pointer" }}>View all</a>
            </div>
            <div className="events">
              {TM.events.slice(0, 8).map((e) => <EventRow key={e.id} e={e} />)}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  window.Dashboard = Dashboard;
})();

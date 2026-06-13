// app.jsx — root: routing, theme, tweaks, toasts.
(function () {
  const { useState, useEffect, useCallback } = React;
  const Icon = window.Icon;
  const { Sidebar, Topbar, Dashboard, Users, ConfigEditor, Runtime, Fingerprints,
    Card, Badge, Button } = window;
  const { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakToggle, TweakSelect } = window;
  const TM = window.TM;

  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "theme": "dark",
    "accent": "#3b82f6",
    "density": "comfortable",
    "sidebar": "expanded",
    "statusDots": true
  }/*EDITMODE-END*/;

  const ACCENTS = {
    "#3b82f6": { h: "#2563eb" },
    "#22d3ee": { h: "#06b6d4" },
    "#a78bfa": { h: "#8b5cf6" },
    "#34d399": { h: "#10b981" },
    "#f59e0b": { h: "#d97706" },
  };
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  // ---- Events page (full list) -------------------------------------------
  function EventsPage() {
    const [sev, setSev] = useState("all");
    const list = TM.events.concat(TM.events.map((e, i) => ({ ...e, id: e.id + "_b", ts: e.ts - 600000 * (i + 14) }))).filter((e) => sev === "all" || e.sev === sev);
    const sevColor = (s) => s === "error" ? "var(--err)" : s === "warn" ? "var(--warn)" : "var(--accent)";
    const counts = { all: list.length, info: 0, warn: 0, error: 0 };
    TM.events.forEach((e) => counts[e.sev] != null && counts[e.sev]++);
    return (
      <div>
        <div className="page-head">
          <div>
            <h1 className="page-title">Events</h1>
            <div className="page-desc">Structured event stream from the control plane.</div>
          </div>
          <div className="page-actions"><Button variant="default" icon={<Icon.download size={14} />}>Export</Button></div>
        </div>
        <div className="tabs tabs-sm" style={{ marginBottom: 14 }}>
          {["all", "info", "warn", "error"].map((s) => (
            <button key={s} className={"tab" + (sev === s ? " active" : "")} onClick={() => setSev(s)} style={{ textTransform: "capitalize" }}>{s}</button>
          ))}
        </div>
        <Card pad={false}>
          <div style={{ padding: "6px 16px" }}>
            {list.map((e) => (
              <div key={e.id} className="event-row" style={{ padding: "11px 0" }}>
                <span className="event-sev" style={{ background: sevColor(e.sev), width: 7, height: 7 }} />
                <Badge tone={e.sev === "error" ? "err" : e.sev === "warn" ? "warn" : "neutral"} size="sm" style={{ textTransform: "uppercase" }}>{e.sev}</Badge>
                <span className="event-type mono" style={{ minWidth: 160 }}>{e.type}</span>
                <span className="event-detail">{e.detail}</span>
                <span className="event-time">{TM.relTime(e.ts)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  function App() {
    const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
    const validRoutes = ["dashboard", "users", "config", "runtime", "security", "events"];
    const [route, setRouteRaw] = useState(() => {
      const h = (location.hash || "").replace("#", "");
      return validRoutes.includes(h) ? h : "dashboard";
    });
    const setRoute = useCallback((r) => { setRouteRaw(r); try { location.hash = r; } catch (e) {} }, []);
    useEffect(() => {
      const onHash = () => { const h = (location.hash || "").replace("#", ""); if (validRoutes.includes(h)) setRouteRaw(h); };
      window.addEventListener("hashchange", onHash);
      return () => window.removeEventListener("hashchange", onHash);
    }, []);
    const [node, setNode] = useState(TM.nodes[0]);
    const [collapsedManual, setCollapsedManual] = useState(null);
    const [toasts, setToasts] = useState([]);

    // theme
    useEffect(() => { document.documentElement.setAttribute("data-theme", t.theme); }, [t.theme]);
    // accent
    useEffect(() => {
      const acc = t.accent; const h = (ACCENTS[acc] || {}).h || acc;
      const r = document.documentElement.style;
      r.setProperty("--accent", acc);
      r.setProperty("--accent-h", h);
      r.setProperty("--accent-soft", hexA(acc, 0.14));
      r.setProperty("--accent-ring", hexA(acc, 0.35));
    }, [t.accent]);
    // status dots visibility
    useEffect(() => {
      document.documentElement.setAttribute("data-dots", t.statusDots ? "on" : "off");
    }, [t.statusDots]);

    const collapsed = collapsedManual != null ? collapsedManual : t.sidebar === "collapsed";

    const toast = useCallback((msg) => {
      const id = Date.now() + Math.random();
      setToasts((ts) => [...ts, { id, msg }]);
      setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 2600);
    }, []);

    const screen = () => {
      switch (route) {
        case "dashboard": return <Dashboard node={node} />;
        case "users": return <Users onToast={toast} />;
        case "config": return <ConfigEditor onToast={toast} />;
        case "runtime": return <Runtime />;
        case "security": return <Fingerprints />;
        case "events": return <EventsPage />;
        default: return <Dashboard node={node} />;
      }
    };

    return (
      <div className={"app" + (collapsed ? " collapsed" : "")}>
        <Sidebar route={route} setRoute={setRoute} collapsed={collapsed} node={node} nodes={TM.nodes} onSelectNode={setNode} />
        <div className="main">
          <Topbar route={route} node={node} theme={t.theme}
            onToggleTheme={() => setTweak("theme", t.theme === "dark" ? "light" : "dark")}
            onToggleSidebar={() => setCollapsedManual(!collapsed)} />
          <div className="content">
            <div className={"content-inner" + (t.density === "compact" ? " dense" : "")} key={route + node.id}>
              {screen()}
            </div>
          </div>
        </div>

        {/* toasts */}
        <div className="toast-wrap">
          {toasts.map((x) => (
            <div key={x.id} className="toast"><span className="toast-ic"><Icon.checkCircle size={15} /></span>{x.msg}</div>
          ))}
        </div>

        <TweaksPanel>
          <TweakSection label="Appearance" />
          <TweakRadio label="Theme" value={t.theme} options={["dark", "light"]} onChange={(v) => setTweak("theme", v)} />
          <TweakColor label="Accent" value={t.accent} options={["#3b82f6", "#22d3ee", "#a78bfa", "#34d399", "#f59e0b"]} onChange={(v) => setTweak("accent", v)} />
          <TweakSection label="Layout" />
          <TweakRadio label="Density" value={t.density} options={["comfortable", "compact"]} onChange={(v) => setTweak("density", v)} />
          <TweakRadio label="Sidebar" value={t.sidebar} options={["expanded", "collapsed"]} onChange={(v) => { setTweak("sidebar", v); setCollapsedManual(null); }} />
          <TweakToggle label="Status dots in nav" value={t.statusDots} onChange={(v) => setTweak("statusDots", v)} />
        </TweaksPanel>
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
})();

// shell.jsx — app shell: sidebar nav, instance switcher, topbar.
(function () {
  const { useState, useRef, useEffect } = React;
  const Icon = window.Icon;
  const { StatusDot, Badge, IconButton } = window;
  const TM = window.TM;

  const NAV = [
    { section: "Overview" },
    { key: "dashboard", label: "Dashboard", icon: Icon.grid, health: "healthy" },
    { key: "users", label: "Users", icon: Icon.users, health: "healthy", badge: 142 },
    { section: "Operate" },
    { key: "config", label: "Config", icon: Icon.sliders, health: "healthy" },
    { key: "runtime", label: "Runtime", icon: Icon.activity, health: "degraded" },
    { key: "security", label: "Security", icon: Icon.shield, health: "warn" },
    { key: "events", label: "Events", icon: Icon.list, health: "healthy" },
  ];

  function InstanceSwitcher({ node, nodes, onSelect }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
      const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      document.addEventListener("mousedown", h);
      return () => document.removeEventListener("mousedown", h);
    }, []);
    return (
      <div className="switcher-wrap" ref={ref} style={{ position: "relative" }}>
        <button className="switcher" onClick={() => setOpen((o) => !o)}>
          <span className="switcher-ic"><Icon.server size={14} /></span>
          <span className="switcher-meta">
            <span className="switcher-name">{node.name}<StatusDot state={node.health} pulse /></span>
            <span className="switcher-region">{node.region}</span>
          </span>
          <span className="switcher-caret"><Icon.selector size={15} /></span>
        </button>
        {open && (
          <div className="node-pop">
            {nodes.map((n) => (
              <div key={n.id} className={"node-opt" + (n.id === node.id ? " active" : "")} onClick={() => { onSelect(n); setOpen(false); }}>
                <StatusDot state={n.health} />
                <span className="node-opt-meta">
                  <span className="node-opt-name">{n.name} {n.id === node.id && <Icon.check size={13} style={{ color: "var(--accent)" }} />}</span>
                  <span className="node-opt-sub mono">{n.host} · v{n.ver}</span>
                </span>
                <span className="node-opt-stat">{n.health === "down" ? "offline" : TM.fmtNum(n.conns) + " conns"}</span>
              </div>
            ))}
            <div className="node-pop-foot">
              <div className="node-opt" style={{ color: "var(--accent)" }}><Icon.plus size={15} /><span className="node-opt-name" style={{ color: "var(--accent)" }}>Add node…</span></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function Sidebar({ route, setRoute, collapsed, node, nodes, onSelectNode }) {
    return (
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-logo"><Icon.zap size={15} /></span>
          <span className="brand-name">tele<b>mt</b></span>
        </div>
        <InstanceSwitcher node={node} nodes={nodes} onSelect={onSelectNode} />
        <nav className="nav">
          {NAV.map((item, i) => item.section ? (
            <div key={i} className="nav-section-t">{item.section}</div>
          ) : (
            <div key={item.key} className={"nav-item" + (route === item.key ? " active" : "")} onClick={() => setRoute(item.key)} title={item.label}>
              <span className="nav-ic"><item.icon size={17} /></span>
              <span className="nav-label">{item.label}</span>
              {item.badge && !collapsed && <span className="nav-badge">{item.badge}</span>}
              <span className="nav-dot"><StatusDot state={item.health} /></span>
            </div>
          ))}
        </nav>
        <div className="side-foot">
          <StatusDot state="healthy" pulse />
          <div className="side-foot-txt"><b>Control API</b> · v1<br />connected · 12ms</div>
        </div>
      </aside>
    );
  }

  const TITLES = {
    dashboard: ["Dashboard", "Overview"],
    users: ["Users", "Overview"],
    config: ["Config", "Operate"],
    runtime: ["Runtime", "Operate"],
    security: ["TLS fingerprints", "Operate"],
    events: ["Events", "Operate"],
  };

  function Topbar({ route, node, theme, onToggleTheme, onToggleSidebar }) {
    const [t] = TITLES[route] || ["", ""];
    const sec = (TITLES[route] || ["", ""])[1];
    return (
      <header className="topbar">
        <IconButton onClick={onToggleSidebar} title="Toggle sidebar"><Icon.list size={17} /></IconButton>
        <div className="crumb">
          <span className="mono muted" style={{ fontSize: 12.5 }}>{node.name}</span>
          <span className="crumb-sep"><Icon.chevronRight size={13} /></span>
          <span className="muted" style={{ fontSize: 12.5 }}>{sec}</span>
          <span className="crumb-sep"><Icon.chevronRight size={13} /></span>
          <span className="topbar-title" style={{ fontSize: 13.5 }}>{t}</span>
        </div>
        <div className="topbar-spacer" />
        <div className="topbar-search" onClick={(e) => e.currentTarget.querySelector("input").focus()}>
          <Icon.search size={14} />
          <input placeholder="Search users, IPs…" />
          <kbd>⌘K</kbd>
        </div>
        <IconButton onClick={onToggleTheme} title="Toggle theme">{theme === "dark" ? <Icon.sun size={17} /> : <Icon.moon size={16} />}</IconButton>
        <IconButton title="Docs"><Icon.external size={16} /></IconButton>
        <span className="u-av" style={{ width: 28, height: 28, borderRadius: 7, background: "var(--accent-soft)", color: "var(--accent)", borderColor: "transparent" }}>op</span>
      </header>
    );
  }

  Object.assign(window, { Sidebar, Topbar });
})();

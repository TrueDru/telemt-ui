// ui.jsx — shared primitives for the Telemt admin UI.
(function () {
  const { useState, useRef, useEffect } = React;
  const Icon = window.Icon;

  // ---- Sparkline ----------------------------------------------------------
  function Sparkline({ data, w = 88, h = 28, color = "var(--accent)", fill = true, strokeW = 1.5 }) {
    if (!data || !data.length) return null;
    const min = Math.min(...data), max = Math.max(...data);
    const span = max - min || 1;
    const step = w / (data.length - 1);
    const pts = data.map((v, i) => [i * step, h - 2 - ((v - min) / span) * (h - 4)]);
    const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const area = line + ` L${w} ${h} L0 ${h} Z`;
    const gid = "sg" + Math.round(data[0] * 1000) + data.length;
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {fill && <path d={area} fill={`url(#${gid})`} />}
        <path d={line} fill="none" stroke={color} strokeWidth={strokeW} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    );
  }

  // ---- Bar (coverage / quota) --------------------------------------------
  function Bar({ value, max = 100, color = "var(--accent)", h = 6, track = "var(--bar-track)", labelInside }) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return (
      <div className="bar" style={{ height: h, background: track }}>
        <div className="bar-fill" style={{ width: pct + "%", background: color }} />
        {labelInside && <span className="bar-label">{labelInside}</span>}
      </div>
    );
  }

  // ---- StatusDot ----------------------------------------------------------
  const STATUS = {
    healthy: { c: "var(--ok)", label: "Healthy" },
    open: { c: "var(--ok)", label: "Open" },
    degraded: { c: "var(--warn)", label: "Degraded" },
    warn: { c: "var(--warn)", label: "Warn" },
    down: { c: "var(--err)", label: "Down" },
    closed: { c: "var(--err)", label: "Closed" },
    info: { c: "var(--accent)", label: "Info" },
    idle: { c: "var(--muted)", label: "Idle" },
  };
  function StatusDot({ state, pulse }) {
    const s = STATUS[state] || STATUS.idle;
    return <span className={"dot" + (pulse && (state === "healthy" || state === "open") ? " dot-pulse" : "")} style={{ background: s.c, "--dot-c": s.c }} />;
  }

  // ---- Badge / Chip -------------------------------------------------------
  function Badge({ tone = "neutral", children, dot, size }) {
    return (
      <span className={"badge badge-" + tone + (size === "sm" ? " badge-sm" : "")}>
        {dot && <span className="badge-dot" />}
        {children}
      </span>
    );
  }

  // ---- Button -------------------------------------------------------------
  function Button({ variant = "default", size = "md", children, icon, iconRight, onClick, disabled, title, full, type }) {
    return (
      <button type={type || "button"} className={`btn btn-${variant} btn-${size}` + (full ? " btn-full" : "")}
        onClick={onClick} disabled={disabled} title={title}>
        {icon && <span className="btn-ic">{icon}</span>}
        {children && <span>{children}</span>}
        {iconRight && <span className="btn-ic">{iconRight}</span>}
      </button>
    );
  }

  // ---- IconButton ---------------------------------------------------------
  function IconButton({ children, onClick, title, active, danger }) {
    return (
      <button className={"icon-btn" + (active ? " is-active" : "") + (danger ? " is-danger" : "")} onClick={onClick} title={title}>
        {children}
      </button>
    );
  }

  // ---- Card ---------------------------------------------------------------
  function Card({ children, className, pad = true, style }) {
    return <div className={"card" + (pad ? " card-pad" : "") + (className ? " " + className : "")} style={style}>{children}</div>;
  }

  // ---- Toggle -------------------------------------------------------------
  function Toggle({ checked, onChange, size = "md", disabled }) {
    return (
      <button className={"toggle toggle-" + size + (checked ? " on" : "") + (disabled ? " disabled" : "")}
        role="switch" aria-checked={checked} disabled={disabled}
        onClick={() => !disabled && onChange && onChange(!checked)}>
        <span className="toggle-knob" />
      </button>
    );
  }

  // ---- CopyButton ---------------------------------------------------------
  function CopyButton({ value, label, full, mono }) {
    const [done, setDone] = useState(false);
    const copy = () => {
      try { navigator.clipboard.writeText(value); } catch (e) {}
      setDone(true); setTimeout(() => setDone(false), 1300);
    };
    return (
      <button className={"copy-btn" + (full ? " copy-full" : "") + (mono ? " mono" : "")} onClick={copy} title="Copy">
        <span className="copy-val">{label || value}</span>
        <span className="copy-ic">{done ? <Icon.check size={13} /> : <Icon.copy size={13} />}</span>
      </button>
    );
  }

  // ---- Tabs ---------------------------------------------------------------
  function Tabs({ tabs, value, onChange, size }) {
    return (
      <div className={"tabs" + (size === "sm" ? " tabs-sm" : "")}>
        {tabs.map((t) => (
          <button key={t.key} className={"tab" + (value === t.key ? " active" : "")} onClick={() => onChange(t.key)}>
            {t.icon && <span className="tab-ic">{t.icon}</span>}
            {t.label}
            {t.count != null && <span className="tab-count">{t.count}</span>}
          </button>
        ))}
      </div>
    );
  }

  // ---- Pseudo-QR (deterministic, structurally QR-like placeholder) --------
  function QR({ value, size = 132 }) {
    const n = 25; // modules
    // deterministic bit grid from value
    let h = 2166136261;
    for (let i = 0; i < value.length; i++) { h ^= value.charCodeAt(i); h = Math.imul(h, 16777619); }
    const rng = (x, y) => {
      let v = (h ^ Math.imul(x + 1, 73856093) ^ Math.imul(y + 1, 19349663)) >>> 0;
      v = Math.imul(v ^ (v >>> 13), 1274126177) >>> 0;
      return (v & 255) > 122;
    };
    const isFinder = (x, y) => {
      const inB = (bx, by) => x >= bx && x < bx + 7 && y >= by && y < by + 7;
      return inB(0, 0) || inB(n - 7, 0) || inB(0, n - 7);
    };
    const finderModule = (x, y) => {
      const local = (bx, by) => { const lx = x - bx, ly = y - by; const ring = lx === 0 || ly === 0 || lx === 6 || ly === 6; const core = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4; return ring || core; };
      if (x < 7 && y < 7) return local(0, 0);
      if (x >= n - 7 && y < 7) return local(n - 7, 0);
      if (x < 7 && y >= n - 7) return local(0, n - 7);
      return false;
    };
    const cells = [];
    const u = size / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      let on;
      if (isFinder(x, y)) on = finderModule(x, y);
      else if ((x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8)) on = false;
      else on = rng(x, y);
      if (on) cells.push(<rect key={x + "_" + y} x={(x * u).toFixed(2)} y={(y * u).toFixed(2)} width={(u + 0.4).toFixed(2)} height={(u + 0.4).toFixed(2)} rx={u * 0.18} />);
    }
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="qr" style={{ display: "block" }}>
        <rect width={size} height={size} rx="10" fill="var(--qr-bg)" />
        <g fill="var(--qr-fg)" transform={`translate(${u * 0},${u * 0})`}>{cells}</g>
      </svg>
    );
  }

  // ---- Drawer (right sheet) ----------------------------------------------
  function Drawer({ open, onClose, children, width = 460 }) {
    useEffect(() => {
      const k = (e) => e.key === "Escape" && onClose && onClose();
      if (open) window.addEventListener("keydown", k);
      return () => window.removeEventListener("keydown", k);
    }, [open]);
    return (
      <div className={"drawer-root" + (open ? " open" : "")} aria-hidden={!open}>
        <div className="scrim" onClick={onClose} />
        <aside className="drawer" style={{ width }}>{open && children}</aside>
      </div>
    );
  }

  // ---- Modal --------------------------------------------------------------
  function Modal({ open, onClose, children, width = 480 }) {
    useEffect(() => {
      const k = (e) => e.key === "Escape" && onClose && onClose();
      if (open) window.addEventListener("keydown", k);
      return () => window.removeEventListener("keydown", k);
    }, [open]);
    if (!open) return null;
    return (
      <div className="modal-root">
        <div className="scrim" onClick={onClose} />
        <div className="modal" style={{ width }}>{children}</div>
      </div>
    );
  }

  // ---- Menu (popover) -----------------------------------------------------
  function Menu({ trigger, items, align = "right" }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
      const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      document.addEventListener("mousedown", h);
      return () => document.removeEventListener("mousedown", h);
    }, []);
    return (
      <div className="menu-wrap" ref={ref}>
        <span onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>{trigger}</span>
        {open && (
          <div className={"menu menu-" + align}>
            {items.map((it, i) => it.sep ? <div key={i} className="menu-sep" /> : (
              <button key={i} className={"menu-item" + (it.danger ? " danger" : "")} onClick={(e) => { e.stopPropagation(); setOpen(false); it.onClick && it.onClick(); }}>
                {it.icon && <span className="menu-ic">{it.icon}</span>}{it.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- Field / inputs -----------------------------------------------------
  function Field({ label, hint, children, restart, dirty }) {
    return (
      <label className="field">
        {label && (
          <span className="field-label">
            {label}
            {restart && <span className="field-restart" title="Changing this requires a manual restart"><Icon.power size={11} /> restart</span>}
            {dirty && <span className="field-dirty" title="Modified" />}
          </span>
        )}
        {children}
        {hint && <span className="field-hint">{hint}</span>}
      </label>
    );
  }
  function Input(props) { return <input className="input" {...props} />; }
  function NumberInput({ value, onChange, unit, ...rest }) {
    return (
      <div className="num-wrap">
        <input className="input" type="number" value={value == null ? "" : value} onChange={(e) => onChange && onChange(e.target.value === "" ? "" : Number(e.target.value))} {...rest} />
        {unit && <span className="num-unit">{unit}</span>}
      </div>
    );
  }
  function Select({ value, onChange, options }) {
    return (
      <div className="select-wrap">
        <select className="input select" value={value} onChange={(e) => onChange && onChange(e.target.value)}>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="select-caret"><Icon.chevronDown size={14} /></span>
      </div>
    );
  }
  function ArrayEditor({ value, onChange, placeholder }) {
    const [draft, setDraft] = useState("");
    const add = () => { const v = draft.trim(); if (!v) return; onChange([...(value || []), v]); setDraft(""); };
    return (
      <div className="arr-editor">
        <div className="arr-chips">
          {(value || []).map((v, i) => (
            <span key={i} className="arr-chip mono">
              {v}
              <button onClick={() => onChange(value.filter((_, j) => j !== i))}><Icon.x size={12} /></button>
            </span>
          ))}
          {(!value || !value.length) && <span className="arr-empty">none</span>}
        </div>
        <div className="arr-add">
          <input className="input mono" value={draft} placeholder={placeholder || "add entry…"} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} />
          <button className="btn btn-default btn-sm" onClick={add}><Icon.plus size={14} /></button>
        </div>
      </div>
    );
  }

  // ---- EmptyState ---------------------------------------------------------
  function EmptyState({ icon, title, desc, reason }) {
    return (
      <div className="empty">
        <div className="empty-ic">{icon || <Icon.moon size={22} />}</div>
        <div className="empty-title">{title}</div>
        {desc && <div className="empty-desc">{desc}</div>}
        {reason && <Badge tone="neutral" size="sm">{reason}</Badge>}
      </div>
    );
  }

  // ---- KeyVal -------------------------------------------------------------
  function KV({ k, children, mono }) {
    return (
      <div className="kv">
        <span className="kv-k">{k}</span>
        <span className={"kv-v" + (mono ? " mono" : "")}>{children}</span>
      </div>
    );
  }

  Object.assign(window, {
    Sparkline, Bar, StatusDot, STATUS, Badge, Button, IconButton, Card, Toggle,
    CopyButton, Tabs, QR, Drawer, Modal, Menu, Field, Input, NumberInput, Select,
    ArrayEditor, EmptyState, KV,
  });
})();

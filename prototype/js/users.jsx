// users.jsx — users table, detail drawer (links/QR + limits form), create dialog.
(function () {
  const { useState, useMemo } = React;
  const Icon = window.Icon;
  const { Card, Badge, Button, IconButton, Toggle, Menu, Drawer, Modal, CopyButton, QR,
    Field, Input, NumberInput, Select, Bar, Sparkline, KV } = window;
  const TM = window.TM;

  function initials(n) { return n.replace(/[^a-z0-9]/gi, "").slice(0, 2); }

  function QuotaCell({ u }) {
    if (!u.quota) return <span className="faint">—</span>;
    const pct = (u.used / u.quota) * 100;
    const color = pct > 90 ? "var(--err)" : pct > 70 ? "var(--warn)" : "var(--accent)";
    return (
      <div className="quota-cell">
        <Bar value={u.used} max={u.quota} color={color} h={5} />
        <div className="quota-meta">
          <span>{TM.fmtBytes(u.used)}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      </div>
    );
  }

  function ExpCell({ u }) {
    if (!u.expiration) return <span className="faint">—</span>;
    const expired = u.expiration < Date.now();
    const soon = !expired && u.expiration - Date.now() < 7 * 86400000;
    return <span className={"nowrap " + (expired ? "" : soon ? "" : "muted")} style={{ color: expired ? "var(--err)" : soon ? "var(--warn)" : undefined, fontVariantNumeric: "tabular-nums" }}>{TM.relFuture(u.expiration)}</span>;
  }

  const COLS = [
    { key: "username", label: "User", sortable: true },
    { key: "enabled", label: "Enabled" },
    { key: "conns", label: "Conns", num: true, sortable: true },
    { key: "ips", label: "IPs", num: true, sortable: true },
    { key: "octets", label: "Total", num: true, sortable: true },
    { key: "quota", label: "Quota", sortable: true },
    { key: "expiration", label: "Expires", sortable: true },
    { key: "_act", label: "" },
  ];

  function UsersTable({ onOpen, onToast }) {
    const [users, setUsers] = useState(() => TM.users.map((u) => ({ ...u })));
    const [q, setQ] = useState("");
    const [sort, setSort] = useState({ key: "conns", dir: "desc" });
    const [filter, setFilter] = useState("all");
    const [showCreate, setShowCreate] = useState(false);

    const toggleSort = (k) => setSort((s) => s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "desc" });
    const setEnabled = (id, v) => setUsers((us) => us.map((u) => u.id === id ? { ...u, enabled: v, conns: v ? u.conns : 0, ips: v ? u.ips : 0 } : u));

    const rows = useMemo(() => {
      let r = users.filter((u) => u.username.toLowerCase().includes(q.toLowerCase()));
      if (filter === "active") r = r.filter((u) => u.conns > 0);
      if (filter === "disabled") r = r.filter((u) => !u.enabled);
      if (filter === "quota") r = r.filter((u) => u.quota);
      const dir = sort.dir === "asc" ? 1 : -1;
      r = [...r].sort((a, b) => {
        let av = a[sort.key], bv = b[sort.key];
        if (sort.key === "quota") { av = a.quota ? a.used / a.quota : -1; bv = b.quota ? b.used / b.quota : -1; }
        if (sort.key === "expiration") { av = a.expiration || Infinity; bv = b.expiration || Infinity; }
        if (typeof av === "string") return av.localeCompare(bv) * dir;
        return ((av || 0) - (bv || 0)) * dir;
      });
      return r;
    }, [users, q, sort, filter]);

    const rowAction = (u, kind) => {
      if (kind === "rotate") onToast("Secret rotated for " + u.username);
      else if (kind === "quota") { setUsers((us) => us.map((x) => x.id === u.id ? { ...x, used: 0 } : x)); onToast("Quota reset for " + u.username); }
      else if (kind === "delete") { setUsers((us) => us.filter((x) => x.id !== u.id)); onToast("Deleted " + u.username); }
      else if (kind === "toggle") setEnabled(u.id, !u.enabled);
    };

    const filters = [
      { k: "all", label: "All", n: users.length },
      { k: "active", label: "Active", n: users.filter((u) => u.conns > 0).length },
      { k: "disabled", label: "Disabled", n: users.filter((u) => !u.enabled).length },
      { k: "quota", label: "Quota", n: users.filter((u) => u.quota).length },
    ];

    return (
      <div>
        <div className="page-head">
          <div>
            <h1 className="page-title">Users</h1>
            <div className="page-desc">{users.length} configured · {users.filter((u) => u.conns > 0).length} with live connections</div>
          </div>
          <div className="page-actions">
            <Button variant="default" icon={<Icon.download size={14} />}>Export</Button>
            <Button variant="primary" icon={<Icon.plus size={15} />} onClick={() => setShowCreate(true)}>New user</Button>
          </div>
        </div>

        <div className="row" style={{ marginBottom: 14, justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div className="tabs tabs-sm">
            {filters.map((f) => (
              <button key={f.k} className={"tab" + (filter === f.k ? " active" : "")} onClick={() => setFilter(f.k)}>
                {f.label}<span className="tab-count">{f.n}</span>
              </button>
            ))}
          </div>
          <div className="topbar-search" style={{ width: 240 }}>
            <Icon.search size={14} />
            <input placeholder="Filter by username…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        <Card pad={false}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  {COLS.map((c) => (
                    <th key={c.key} className={(c.num ? "num " : "") + (c.sortable ? "sortable" : "")}
                      style={{ paddingTop: 14, width: c.key === "username" ? 200 : c.key === "quota" ? 150 : undefined }}
                      onClick={() => c.sortable && toggleSort(c.key)}>
                      {c.label}
                      {c.sortable && sort.key === c.key && <span className="sort-ic">{sort.dir === "asc" ? <Icon.arrowUp size={11} /> : <Icon.arrowDown size={11} />}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="clickable" onClick={() => onOpen(u, setUsers)}>
                    <td>
                      <div className="u-name">
                        <span className="u-av">{initials(u.username)}</span>
                        <span className="mono" style={{ opacity: u.enabled ? 1 : 0.5 }}>{u.username}</span>
                        {u.adTag && <Badge tone="neutral" size="sm">{u.adTag}</Badge>}
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <Toggle size="sm" checked={u.enabled} onChange={(v) => setEnabled(u.id, v)} />
                    </td>
                    <td className="num tnum">{u.conns > 0 ? u.conns : <span className="faint">0</span>}</td>
                    <td className="num tnum">{u.ips > 0 ? u.ips : <span className="faint">0</span>}</td>
                    <td className="num tnum mono">{TM.fmtBytes(u.octets)}</td>
                    <td><QuotaCell u={u} /></td>
                    <td><ExpCell u={u} /></td>
                    <td className="num" onClick={(e) => e.stopPropagation()}>
                      <Menu
                        trigger={<IconButton title="Actions"><Icon.dots size={16} /></IconButton>}
                        items={[
                          { icon: <Icon.refresh size={14} />, label: "Rotate secret", onClick: () => rowAction(u, "rotate") },
                          { icon: <Icon.power size={14} />, label: u.enabled ? "Disable" : "Enable", onClick: () => rowAction(u, "toggle") },
                          { icon: <Icon.zap size={14} />, label: "Reset quota", onClick: () => rowAction(u, "quota") },
                          { sep: true },
                          { icon: <Icon.trash size={14} />, label: "Delete user", danger: true, onClick: () => rowAction(u, "delete") },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={COLS.length}><div className="empty"><div className="empty-title">No users match.</div></div></td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        <CreateUserDialog open={showCreate} onClose={() => setShowCreate(false)} onCreate={(u) => { setUsers((us) => [u, ...us]); onToast("Created user " + u.username); }} />
      </div>
    );
  }

  // ---- detail drawer ------------------------------------------------------
  function UserDrawer({ user, open, onClose, onSave, onToast }) {
    const [edit, setEdit] = useState({});
    React.useEffect(() => { if (user) setEdit({ maxTcpConns: user.maxTcpConns || "", rateUp: user.rateUp || "", rateDown: user.rateDown || "", maxUniqueIps: user.maxUniqueIps || "", quota: user.quota ? Math.round(user.quota / 1e9) : "", exp: user.expiration ? new Date(user.expiration).toISOString().slice(0, 10) : "", adTag: user.adTag || "" }); }, [user && user.id]);
    if (!user) return null;
    const dirty = JSON.stringify({ maxTcpConns: user.maxTcpConns || "", rateUp: user.rateUp || "", rateDown: user.rateDown || "", maxUniqueIps: user.maxUniqueIps || "", quota: user.quota ? Math.round(user.quota / 1e9) : "", exp: user.expiration ? new Date(user.expiration).toISOString().slice(0, 10) : "", adTag: user.adTag || "" }) !== JSON.stringify(edit);

    const link = (m) => `tg://proxy?server=fra-edge-01.telemt.net&port=443&secret=${user.secret}${m.domain ? "&fp=" + m.domain : ""}`;

    return (
      <Drawer open={open} onClose={onClose} width={480}>
        <div className="drawer-head">
          <span className="u-av" style={{ width: 36, height: 36, fontSize: 13, borderRadius: 9 }}>{initials(user.username)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row" style={{ gap: 8 }}>
              <span className="mono" style={{ fontWeight: 600, fontSize: 15 }}>{user.username}</span>
              <Badge tone={user.enabled ? "ok" : "neutral"} dot size="sm">{user.enabled ? "Enabled" : "Disabled"}</Badge>
            </div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>created {TM.fmtDate(user.created)} · {user.conns} live · {user.ips} unique IPs</div>
          </div>
          <IconButton onClick={onClose} title="Close"><Icon.x size={17} /></IconButton>
        </div>
        <div className="drawer-body">
          {/* live stats */}
          <div className="grid-2" style={{ gap: 10, marginBottom: 20 }}>
            <Card className="card-pad" style={{ padding: 12 }}>
              <div className="stat-label" style={{ fontSize: 10.5 }}><Icon.arrowDown size={12} />Down</div>
              <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
                <span className="mono" style={{ fontWeight: 600, fontSize: 15 }}>{TM.fmtBytes(user.octets * 0.7)}</span>
                <Sparkline data={user.sparkDown} color="var(--ok)" w={64} h={22} />
              </div>
            </Card>
            <Card className="card-pad" style={{ padding: 12 }}>
              <div className="stat-label" style={{ fontSize: 10.5 }}><Icon.arrowUp size={12} />Up</div>
              <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
                <span className="mono" style={{ fontWeight: 600, fontSize: 15 }}>{TM.fmtBytes(user.octets * 0.3)}</span>
                <Sparkline data={user.sparkUp} color="var(--accent)" w={64} h={22} />
              </div>
            </Card>
          </div>

          {/* connection links */}
          <div className="section-label">Connection links</div>
          <div className="row" style={{ gap: 16, alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ flexShrink: 0 }}>
              <QR value={link(TM.proxyModes[0])} size={120} />
              <div className="muted" style={{ fontSize: 10.5, textAlign: "center", marginTop: 6 }}>scan to connect</div>
            </div>
            <div className="col" style={{ gap: 8, flex: 1, minWidth: 0 }}>
              {TM.proxyModes.map((m) => (
                <div key={m.mode} className="col" style={{ gap: 4 }}>
                  <span className="muted" style={{ fontSize: 11 }}>{m.mode}</span>
                  <CopyButton value={link(m)} label={link(m)} full mono />
                </div>
              ))}
            </div>
          </div>

          {/* secret */}
          <div className="section-label" style={{ marginTop: 20 }}>Secret</div>
          <div className="row" style={{ gap: 8 }}>
            <CopyButton value={user.secret} label={user.secret} full mono />
            <Button variant="default" icon={<Icon.refresh size={14} />} onClick={() => onToast("Secret rotated")}>Rotate</Button>
          </div>

          {/* limits form */}
          <div className="section-label" style={{ marginTop: 22 }}>Limits &amp; policy</div>
          <div className="grid-2" style={{ gap: 14 }}>
            <Field label="max_tcp_conns" hint="0 = unlimited">
              <NumberInput value={edit.maxTcpConns} onChange={(v) => setEdit({ ...edit, maxTcpConns: v })} placeholder="0" />
            </Field>
            <Field label="max_unique_ips">
              <NumberInput value={edit.maxUniqueIps} onChange={(v) => setEdit({ ...edit, maxUniqueIps: v })} placeholder="unlimited" />
            </Field>
            <Field label="rate_limit_up_bps">
              <NumberInput value={edit.rateUp} onChange={(v) => setEdit({ ...edit, rateUp: v })} unit="bps" placeholder="0" />
            </Field>
            <Field label="rate_limit_down_bps">
              <NumberInput value={edit.rateDown} onChange={(v) => setEdit({ ...edit, rateDown: v })} unit="bps" placeholder="0" />
            </Field>
            <Field label="data_quota_bytes" hint="in GB">
              <NumberInput value={edit.quota} onChange={(v) => setEdit({ ...edit, quota: v })} unit="GB" placeholder="∞" />
            </Field>
            <Field label="expiration_rfc3339">
              <Input type="date" value={edit.exp} onChange={(e) => setEdit({ ...edit, exp: e.target.value })} />
            </Field>
            <Field label="user_ad_tag">
              <Input value={edit.adTag} onChange={(e) => setEdit({ ...edit, adTag: e.target.value })} placeholder="none" className="input mono" />
            </Field>
          </div>
        </div>
        <div className="drawer-foot">
          <Button variant="danger" icon={<Icon.trash size={14} />} onClick={() => { onSave(user.id, "delete"); onClose(); onToast("Deleted " + user.username); }}>Delete</Button>
          <div style={{ flex: 1 }} />
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!dirty} onClick={() => { onSave(user.id, "save", edit); onToast("Saved " + user.username); }}>Save changes</Button>
        </div>
      </Drawer>
    );
  }

  // ---- create dialog ------------------------------------------------------
  function CreateUserDialog({ open, onClose, onCreate }) {
    const [name, setName] = useState("");
    const [secret, setSecret] = useState("");
    const [adv, setAdv] = useState(false);
    const [adt, setAdt] = useState({ maxTcp: "", quota: "", exp: "", tag: "" });
    React.useEffect(() => { if (open) { setName(""); setSecret(""); setAdv(false); setAdt({ maxTcp: "", quota: "", exp: "", tag: "" }); } }, [open]);
    const gen = () => setSecret("ee" + TM.SECRET());
    const create = () => {
      const u = {
        id: "u" + Date.now(), username: name || "user_new", enabled: true, conns: 0, ips: 0, octets: 0,
        quota: adt.quota ? Number(adt.quota) * 1e9 : null, used: adt.quota ? 0 : null,
        expiration: adt.exp ? new Date(adt.exp).getTime() : null, maxTcpConns: adt.maxTcp ? Number(adt.maxTcp) : null,
        rateUp: null, rateDown: null, maxUniqueIps: null, adTag: adt.tag, secret: secret || "ee" + TM.SECRET(),
        created: Date.now(), sparkUp: TM.spark(99, 24, 2, 3), sparkDown: TM.spark(98, 24, 3, 4),
      };
      onCreate(u); onClose();
    };
    return (
      <Modal open={open} onClose={onClose} width={440}>
        <div className="modal-head">
          <div className="modal-title">Create user</div>
          <div className="modal-desc">Provision a new proxy credential on this node.</div>
        </div>
        <div className="modal-body col" style={{ gap: 14 }}>
          <Field label="Username" hint="Lowercase, unique per node.">
            <Input value={name} onChange={(e) => setName(e.target.value.replace(/\s/g, "_"))} placeholder="e.g. nova_eu" className="input mono" autoFocus />
          </Field>
          <Field label="Secret" hint="Leave blank to auto-generate on save.">
            <div className="row" style={{ gap: 8 }}>
              <Input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="optional — ee…" className="input mono" />
              <Button variant="default" icon={<Icon.zap size={14} />} onClick={gen}>Generate</Button>
            </div>
          </Field>
          <button className="cfg-head" style={{ padding: "8px 0", borderTop: "1px solid var(--border)", marginTop: 2 }} onClick={() => setAdv((a) => !a)}>
            <Icon.chevronRight size={15} className="cfg-chev" style={{ transform: adv ? "rotate(90deg)" : "" }} />
            <span className="cfg-title" style={{ fontSize: 12.5 }}>Advanced limits</span>
            <span className="muted" style={{ marginLeft: "auto", fontSize: 11 }}>optional</span>
          </button>
          {adv && (
            <div className="grid-2" style={{ gap: 12 }}>
              <Field label="max_tcp_conns"><NumberInput value={adt.maxTcp} onChange={(v) => setAdt({ ...adt, maxTcp: v })} placeholder="0" /></Field>
              <Field label="data_quota (GB)"><NumberInput value={adt.quota} onChange={(v) => setAdt({ ...adt, quota: v })} unit="GB" placeholder="∞" /></Field>
              <Field label="expiration"><Input type="date" value={adt.exp} onChange={(e) => setAdt({ ...adt, exp: e.target.value })} /></Field>
              <Field label="user_ad_tag"><Input value={adt.tag} onChange={(e) => setAdt({ ...adt, tag: e.target.value })} placeholder="none" className="input mono" /></Field>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={create} disabled={!name}>Create user</Button>
        </div>
      </Modal>
    );
  }

  function Users({ onToast }) {
    const [active, setActive] = useState(null);
    const setUsersRef = React.useRef(null);
    const open = (u, setUsers) => { setActive(u); setUsersRef.current = setUsers; };
    const onSave = (id, kind, edit) => {
      const setUsers = setUsersRef.current; if (!setUsers) return;
      if (kind === "delete") { setUsers((us) => us.filter((x) => x.id !== id)); setActive(null); return; }
      setUsers((us) => us.map((x) => x.id === id ? {
        ...x,
        maxTcpConns: edit.maxTcpConns || null, rateUp: edit.rateUp || null, rateDown: edit.rateDown || null,
        maxUniqueIps: edit.maxUniqueIps || null, quota: edit.quota ? Number(edit.quota) * 1e9 : null,
        used: edit.quota ? Math.min(Number(edit.quota) * 1e9, x.used || x.octets) : null,
        expiration: edit.exp ? new Date(edit.exp).getTime() : null, adTag: edit.adTag,
      } : x));
      setActive((a) => a && a.id === id ? { ...a, maxTcpConns: edit.maxTcpConns || null, adTag: edit.adTag } : a);
    };
    return (
      <div>
        <UsersTable onOpen={open} onToast={onToast} />
        <UserDrawer user={active} open={!!active} onClose={() => setActive(null)} onSave={onSave} onToast={onToast} />
      </div>
    );
  }

  window.Users = Users;
})();

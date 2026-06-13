// config.jsx — config editor: accordion sections, dirty tracking, save bar, restart confirm.
(function () {
  const { useState, useMemo } = React;
  const Icon = window.Icon;
  const { Card, Badge, Button, Toggle, Field, Input, NumberInput, Select, ArrayEditor, Modal, KV } = window;
  const TM = window.TM;

  function cloneCfg(c) { return JSON.parse(JSON.stringify(c)); }

  function FieldControl({ f, value, onChange }) {
    switch (f.type) {
      case "toggle": return <Toggle checked={value} onChange={onChange} />;
      case "number": return <NumberInput value={value} onChange={onChange} unit={f.unit} />;
      case "select": return <Select value={value} options={f.options} onChange={onChange} />;
      case "array": return <ArrayEditor value={value} onChange={onChange} />;
      case "multiselect":
        return (
          <div className="row" style={{ gap: 7, flexWrap: "wrap" }}>
            {f.options.map((o) => {
              const on = value.includes(o);
              return <button key={o} className={"badge " + (on ? "badge-accent" : "badge-neutral")} style={{ cursor: "pointer", padding: "4px 10px" }}
                onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}>{on && <Icon.check size={12} />}{o}</button>;
            })}
          </div>
        );
      case "secret": return (
        <div className="row" style={{ gap: 7 }}>
          <Input value={value} readOnly className="input mono" />
          <Button variant="default" icon={<Icon.refresh size={14} />}>Rotate</Button>
        </div>
      );
      default: return <Input value={value} onChange={(e) => onChange(e.target.value)} className={"input" + (f.type === "text" ? " mono" : "")} />;
    }
  }

  function Section({ skey, sect, draft, base, setVal, open, onToggle }) {
    const fields = Object.keys(sect).filter((k) => !k.startsWith("_"));
    const dirtyCount = fields.filter((k) => JSON.stringify(draft[skey][k].value) !== JSON.stringify(base[skey][k].value)).length;
    const inlineToggles = fields.filter((k) => sect[k].type === "toggle");
    const regular = fields.filter((k) => sect[k].type !== "toggle");

    return (
      <div className={"cfg-section" + (open ? " open" : "")}>
        <div className="cfg-head" onClick={onToggle}>
          <Icon.chevronRight size={16} className="cfg-chev" />
          <span className="cfg-title">{sect._label}</span>
          <span className="muted mono" style={{ fontSize: 11 }}>{skey}</span>
          <div className="cfg-meta">
            {dirtyCount > 0 && <Badge tone="accent" size="sm">{dirtyCount} changed</Badge>}
            {sect._restart && <Badge tone="warn" size="sm" dot>restart on change</Badge>}
          </div>
        </div>
        {open && (
          <div className={"cfg-body" + (regular.length <= 1 ? " cols-1" : "")}>
            {regular.map((k) => {
              const f = sect[k];
              const wide = f.type === "array" || f.type === "multiselect";
              const isDirty = JSON.stringify(draft[skey][k].value) !== JSON.stringify(base[skey][k].value);
              return (
                <div key={k} className={wide ? "cfg-field-wide" : ""}>
                  <Field label={f.label} restart={f.restart} dirty={isDirty} hint={<span className="mono" style={{ fontSize: 10.5 }}>{skey}.{k}</span>}>
                    <FieldControl f={f} value={draft[skey][k].value} onChange={(v) => setVal(skey, k, v)} />
                  </Field>
                </div>
              );
            })}
            {inlineToggles.length > 0 && (
              <div className="cfg-field-wide col" style={{ gap: 2, borderTop: regular.length ? "1px solid var(--border)" : "none", paddingTop: regular.length ? 12 : 0 }}>
                {inlineToggles.map((k) => {
                  const f = sect[k];
                  const isDirty = JSON.stringify(draft[skey][k].value) !== JSON.stringify(base[skey][k].value);
                  return (
                    <div key={k} className="cfg-inline">
                      <div className="cfg-inline-meta">
                        <div className="cfg-inline-label">{f.label} {isDirty && <span className="field-dirty" style={{ display: "inline-block", margin: 0 }} />}</div>
                        {f.desc && <div className="cfg-inline-desc">{f.desc}</div>}
                      </div>
                      <Toggle checked={draft[skey][k].value} onChange={(v) => setVal(skey, k, v)} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  function ConfigEditor({ onToast }) {
    const [base, setBase] = useState(() => cloneCfg(TM.config));
    const [draft, setDraft] = useState(() => cloneCfg(TM.config));
    const [open, setOpen] = useState({ general: true });
    const [confirm, setConfirm] = useState(false);

    const setVal = (sk, k, v) => setDraft((d) => { const n = cloneCfg(d); n[sk][k].value = v; return n; });

    const diffs = useMemo(() => {
      const out = [];
      Object.keys(base).forEach((sk) => Object.keys(base[sk]).forEach((k) => {
        if (k.startsWith("_")) return;
        if (JSON.stringify(base[sk][k].value) !== JSON.stringify(draft[sk][k].value)) out.push({ sk, k, restart: base[sk]._restart && base[sk][k].restart });
      }));
      return out;
    }, [base, draft]);

    const needsRestart = diffs.some((d) => d.restart);
    const dirty = diffs.length > 0;

    const apply = () => { setBase(cloneCfg(draft)); setConfirm(false); onToast(needsRestart ? "Config applied — restart required" : "Config applied"); };
    const discard = () => setDraft(cloneCfg(base));

    return (
      <div>
        <div className="page-head">
          <div>
            <h1 className="page-title">Config</h1>
            <div className="page-desc">Edit the live server configuration. Sections marked <Badge tone="warn" size="sm" dot>restart</Badge> need a manual restart to take effect.</div>
          </div>
          <div className="page-actions">
            <Button variant="default" icon={<Icon.download size={14} />}>Export TOML</Button>
            <button className="btn btn-ghost btn-md" onClick={() => setOpen(Object.fromEntries(Object.keys(base).map((k) => [k, true])))}>Expand all</button>
          </div>
        </div>

        {Object.keys(base).map((sk) => (
          <Section key={sk} skey={sk} sect={base[sk]} draft={draft} base={base} setVal={setVal}
            open={!!open[sk]} onToggle={() => setOpen((o) => ({ ...o, [sk]: !o[sk] }))} />
        ))}

        {dirty && (
          <div className="savebar">
            <div className="row" style={{ gap: 10 }}>
              <Icon.pulse size={16} style={{ color: "var(--accent)" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 12.5 }}>{diffs.length} unsaved change{diffs.length > 1 ? "s" : ""}</div>
                <div className="savebar-diff muted" style={{ marginTop: 2 }}>
                  {diffs.slice(0, 4).map((d, i) => <span key={i} className="diff-chip">{d.sk}.{d.k}</span>)}
                  {diffs.length > 4 && <span className="muted">+{diffs.length - 4} more</span>}
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }} />
            {needsRestart && <Badge tone="warn" dot><Icon.power size={12} />restart required</Badge>}
            <Button variant="ghost" onClick={discard}>Discard</Button>
            <Button variant={needsRestart ? "dangerSolid" : "primary"} icon={needsRestart ? <Icon.alert size={14} /> : <Icon.check size={15} />}
              onClick={() => needsRestart ? setConfirm(true) : apply()}>
              {needsRestart ? "Save & require restart" : "Save changes"}
            </Button>
          </div>
        )}

        <Modal open={confirm} onClose={() => setConfirm(false)} width={440}>
          <div className="modal-head">
            <div className="row" style={{ gap: 10 }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, display: "grid", placeItems: "center", background: "var(--err-soft)", color: "var(--err)" }}><Icon.alert size={17} /></span>
              <div className="modal-title">Restart required</div>
            </div>
            <div className="modal-desc" style={{ marginTop: 10 }}>The following changes alter the proxy's listening behavior and will only apply after a manual <span className="mono">telemt restart</span>. Active connections will be dropped.</div>
          </div>
          <div className="modal-body">
            <div className="col" style={{ gap: 0 }}>
              {diffs.filter((d) => d.restart).map((d, i) => (
                <KV key={i} k={<span className="mono" style={{ fontSize: 11.5 }}>{d.sk}.{d.k}</span>} mono>
                  <span className="muted" style={{ textDecoration: "line-through", marginRight: 8 }}>{JSON.stringify(base[d.sk][d.k].value).slice(0, 22)}</span>
                  <span style={{ color: "var(--accent)" }}>{JSON.stringify(draft[d.sk][d.k].value).slice(0, 22)}</span>
                </KV>
              ))}
            </div>
          </div>
          <div className="modal-foot">
            <Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button variant="dangerSolid" icon={<Icon.power size={14} />} onClick={apply}>Save &amp; flag for restart</Button>
          </div>
        </Modal>
        {dirty && <div style={{ height: 64 }} />}
      </div>
    );
  }

  window.ConfigEditor = ConfigEditor;
})();

// icons.jsx — compact line-icon set for the Telemt admin UI (stroke, 24-grid).
(function () {
  const S = ({ children, size = 16, fill = "none", style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0, ...style }}>
      {children}
    </svg>
  );
  const P = (d) => <path d={d} />;

  const Icon = {
    grid: (p) => <S {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></S>,
    users: (p) => <S {...p}>{P("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2")}<circle cx="9" cy="7" r="4" />{P("M22 21v-2a4 4 0 0 0-3-3.87")}{P("M16 3.13a4 4 0 0 1 0 7.75")}</S>,
    sliders: (p) => <S {...p}>{P("M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6")}</S>,
    activity: (p) => <S {...p}>{P("M22 12h-4l-3 9L9 3l-3 9H2")}</S>,
    shield: (p) => <S {...p}>{P("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z")}</S>,
    list: (p) => <S {...p}>{P("M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01")}</S>,
    server: (p) => <S {...p}><rect x="2" y="3" width="20" height="7" rx="1.5" /><rect x="2" y="14" width="20" height="7" rx="1.5" />{P("M6 6.5h.01M6 17.5h.01")}</S>,
    chevronDown: (p) => <S {...p}>{P("M6 9l6 6 6-6")}</S>,
    chevronRight: (p) => <S {...p}>{P("M9 18l6-6-6-6")}</S>,
    chevronLeft: (p) => <S {...p}>{P("M15 18l-6-6 6-6")}</S>,
    selector: (p) => <S {...p}>{P("M7 15l5 5 5-5M7 9l5-5 5 5")}</S>,
    search: (p) => <S {...p}><circle cx="11" cy="11" r="7" />{P("M21 21l-4.3-4.3")}</S>,
    plus: (p) => <S {...p}>{P("M12 5v14M5 12h14")}</S>,
    copy: (p) => <S {...p}><rect x="9" y="9" width="13" height="13" rx="2" />{P("M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1")}</S>,
    check: (p) => <S {...p}>{P("M20 6L9 17l-5-5")}</S>,
    dots: (p) => <S {...p}><circle cx="12" cy="5" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="12" cy="19" r="1.4" /></S>,
    x: (p) => <S {...p}>{P("M18 6L6 18M6 6l12 12")}</S>,
    refresh: (p) => <S {...p}>{P("M23 4v6h-6M1 20v-6h6")}{P("M3.5 9a9 9 0 0 1 14.8-3.4L23 10M1 14l4.7 4.4A9 9 0 0 0 20.5 15")}</S>,
    trash: (p) => <S {...p}>{P("M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2")}</S>,
    power: (p) => <S {...p}>{P("M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10")}</S>,
    alert: (p) => <S {...p}>{P("M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01")}</S>,
    checkCircle: (p) => <S {...p}><circle cx="12" cy="12" r="9" />{P("M8.5 12.5l2.5 2.5 4.5-5")}</S>,
    xCircle: (p) => <S {...p}><circle cx="12" cy="12" r="9" />{P("M15 9l-6 6M9 9l6 6")}</S>,
    info: (p) => <S {...p}><circle cx="12" cy="12" r="9" />{P("M12 11v5M12 8h.01")}</S>,
    sun: (p) => <S {...p}><circle cx="12" cy="12" r="4" />{P("M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4")}</S>,
    moon: (p) => <S {...p}>{P("M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z")}</S>,
    arrowUp: (p) => <S {...p}>{P("M12 19V5M5 12l7-7 7 7")}</S>,
    arrowDown: (p) => <S {...p}>{P("M12 5v14M19 12l-7 7-7-7")}</S>,
    external: (p) => <S {...p}>{P("M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3")}</S>,
    lock: (p) => <S {...p}><rect x="3" y="11" width="18" height="11" rx="2" />{P("M7 11V7a5 5 0 0 1 10 0v4")}</S>,
    clock: (p) => <S {...p}><circle cx="12" cy="12" r="9" />{P("M12 7v5l3 2")}</S>,
    zap: (p) => <S {...p}>{P("M13 2L3 14h9l-1 8 10-12h-9l1-8z")}</S>,
    globe: (p) => <S {...p}><circle cx="12" cy="12" r="9" />{P("M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z")}</S>,
    filter: (p) => <S {...p}>{P("M22 3H2l8 9.5V19l4 2v-8.5L22 3z")}</S>,
    download: (p) => <S {...p}>{P("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3")}</S>,
    eye: (p) => <S {...p}>{P("M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z")}<circle cx="12" cy="12" r="3" /></S>,
    fingerprint: (p) => <S {...p}>{P("M12 11a2 2 0 0 1 2 2c0 2.5-.5 4-1 5M8 14.5c.5-1.5.5-3 .5-4.5a3.5 3.5 0 0 1 7 0M5.5 12a6.5 6.5 0 0 1 13 0v1M9 19c.5-1 1-2.5 1-5")}</S>,
    pulse: (p) => <S {...p}>{P("M3 12h4l2-6 4 14 2-8h6")}</S>,
  };

  window.Icon = Icon;
})();

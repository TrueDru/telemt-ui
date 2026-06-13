export function fmtNum(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US");
}

export function fmtUptime(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** `ts` is a Unix epoch in milliseconds. */
export function relTime(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 5) return "just now";
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/** `iso` is an RFC3339 timestamp; `false` for missing/unparseable input. */
export function isExpired(iso: string): boolean {
  return Date.parse(iso) < Date.now();
}

/** Future-pointing relative time, e.g. "in 3d" / "5h ago" for already-passed timestamps. */
export function relFuture(ts: number): string {
  const diff = (ts - Date.now()) / 1000;
  if (diff < 0) return `${relTime(ts)}`;
  if (diff < 60) return `in ${Math.floor(diff)}s`;
  if (diff < 3600) return `in ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `in ${Math.floor(diff / 3600)}h`;
  return `in ${Math.floor(diff / 86400)}d`;
}

export function fmtBytes(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  const v = n / Math.pow(1024, i);
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function fmtBps(n: number | null | undefined): string {
  if (n == null) return "unlimited";
  if (n === 0) return "unlimited";
  const units = ["bps", "Kbps", "Mbps", "Gbps"];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1000)), units.length - 1);
  const v = n / Math.pow(1000, i);
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

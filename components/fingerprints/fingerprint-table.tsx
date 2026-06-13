import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { fmtNum, relTime } from "@/lib/format";
import type { TlsFingerprintRow } from "@/lib/telemt/schemas/fingerprints";

export function FingerprintTable({
  rows,
  scopeLabel,
}: {
  rows: TlsFingerprintRow[];
  /** Column header for `scope`; omit the column entirely for `by_fingerprint`. */
  scopeLabel?: string;
}) {
  if (rows.length === 0) return <EmptyState title="No fingerprints observed yet" />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {scopeLabel && <TableHead>{scopeLabel}</TableHead>}
          <TableHead>JA3</TableHead>
          <TableHead>JA4</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Auth OK</TableHead>
          <TableHead>Bad/probe</TableHead>
          <TableHead>First seen</TableHead>
          <TableHead>Last seen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={`${r.scope ?? "global"}-${r.ja3}-${r.ja4}-${i}`}>
            {scopeLabel && <TableCell className="font-mono text-xs">{r.scope ?? "—"}</TableCell>}
            <TableCell className="max-w-40 truncate font-mono text-xs" title={r.ja3_raw}>
              {r.ja3}
            </TableCell>
            <TableCell className="max-w-40 truncate font-mono text-xs" title={r.ja4_raw}>
              {r.ja4}
            </TableCell>
            <TableCell>{fmtNum(r.total)}</TableCell>
            <TableCell>{fmtNum(r.auth_success)}</TableCell>
            <TableCell>{fmtNum(r.bad_or_probe)}</TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {relTime(r.first_seen_epoch_secs * 1000)}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {relTime(r.last_seen_epoch_secs * 1000)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

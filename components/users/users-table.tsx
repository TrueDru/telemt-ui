"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  KeyRound,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users as UsersIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { CreateUserDialog } from "@/components/users/create-user-dialog";
import { UserDetailSheet } from "@/components/users/user-detail-sheet";
import {
  describeError,
  useDeleteUser,
  useResetUserQuota,
  useRotateUserSecret,
  useSetUserEnabled,
  useUsersQuery,
} from "@/components/users/queries";
import { fmtBytes, fmtNum, isExpired, relFuture } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { UserInfo } from "@/lib/telemt/schemas/users";

type SortKey =
  | "username"
  | "current_connections"
  | "active_unique_ips"
  | "total_octets"
  | "quota"
  | "expiration";

interface SortState {
  key: SortKey;
  dir: "asc" | "desc";
}

type FilterKey = "all" | "active" | "disabled" | "quota";

type ConfirmAction = {
  kind: "rotate-secret" | "reset-quota" | "delete";
  username: string;
};

const CONFIRM_COPY: Record<
  ConfirmAction["kind"],
  { title: (u: string) => string; description: string; action: string; destructive?: boolean }
> = {
  "rotate-secret": {
    title: (u) => `Rotate secret for ${u}?`,
    description:
      "The current secret and all existing tg://proxy links for this user stop working immediately.",
    action: "Rotate secret",
  },
  "reset-quota": {
    title: (u) => `Reset quota for ${u}?`,
    description: "This resets the used-bytes counter for this user back to zero.",
    action: "Reset quota",
  },
  delete: {
    title: (u) => `Delete ${u}?`,
    description:
      "This permanently removes the user and its access-map entries. This can't be undone.",
    action: "Delete user",
    destructive: true,
  },
};

function sortValue(u: UserInfo, key: SortKey): string | number {
  switch (key) {
    case "username":
      return u.username;
    case "current_connections":
      return u.current_connections;
    case "active_unique_ips":
      return u.active_unique_ips;
    case "total_octets":
      return u.total_octets;
    case "quota":
      return u.data_quota_bytes ? u.total_octets / u.data_quota_bytes : -1;
    case "expiration":
      return u.expiration_rfc3339 ? Date.parse(u.expiration_rfc3339) : Infinity;
  }
}

function QuotaCell({ user }: { user: UserInfo }) {
  if (!user.data_quota_bytes) return <span className="text-muted-foreground">—</span>;
  const pct = Math.min(100, (user.total_octets / user.data_quota_bytes) * 100);
  return (
    <div className="flex w-28 flex-col gap-1">
      <Progress value={pct} />
      <div className="text-muted-foreground flex justify-between text-[11px] tabular-nums">
        <span>{fmtBytes(user.total_octets)}</span>
        <span>{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

function ExpiresCell({ iso }: { iso?: string | null }) {
  if (!iso) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={cn("text-xs tabular-nums", isExpired(iso) && "text-destructive")}>
      {relFuture(Date.parse(iso))}
    </span>
  );
}

export function UsersTable({
  instanceId,
  initialUsers,
}: {
  instanceId: string;
  initialUsers?: UserInfo[];
}) {
  const { data: users, isError, error } = useUsersQuery(instanceId, initialUsers);
  const setEnabled = useSetUserEnabled(instanceId);
  const rotateSecret = useRotateUserSecret(instanceId);
  const resetQuota = useResetUserQuota(instanceId);
  const deleteUser = useDeleteUser(instanceId);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortState>({ key: "username", dir: "asc" });
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
    );

  const rows = useMemo(() => {
    let r = users ?? [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter((u) => u.username.toLowerCase().includes(q));
    }
    if (filter === "active") r = r.filter((u) => u.current_connections > 0);
    else if (filter === "disabled") r = r.filter((u) => !u.enabled);
    else if (filter === "quota") r = r.filter((u) => u.data_quota_bytes != null);

    const dir = sort.dir === "asc" ? 1 : -1;
    return [...r].sort((a, b) => {
      const av = sortValue(a, sort.key);
      const bv = sortValue(b, sort.key);
      if (typeof av === "string" || typeof bv === "string") {
        return String(av).localeCompare(String(bv)) * dir;
      }
      return (av - bv) * dir;
    });
  }, [users, search, filter, sort]);

  const filters: { key: FilterKey; label: string; count: number }[] = useMemo(() => {
    const all = users ?? [];
    return [
      { key: "all", label: "All", count: all.length },
      {
        key: "active",
        label: "Active",
        count: all.filter((u) => u.current_connections > 0).length,
      },
      { key: "disabled", label: "Disabled", count: all.filter((u) => !u.enabled).length },
      { key: "quota", label: "Quota", count: all.filter((u) => u.data_quota_bytes != null).length },
    ];
  }, [users]);

  const selectedUser = users?.find((u) => u.username === selectedUsername) ?? null;

  const handleConfirm = () => {
    if (!confirmAction) return;
    const { kind, username } = confirmAction;
    if (kind === "rotate-secret") rotateSecret.mutate(username);
    else if (kind === "reset-quota") resetQuota.mutate(username);
    else if (kind === "delete") {
      deleteUser.mutate(username);
      if (selectedUsername === username) setSelectedUsername(null);
    }
    setConfirmAction(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Users</h1>
          <p className="text-muted-foreground text-sm">
            {users ? `${fmtNum(users.length)} configured` : "—"}
            {users
              ? ` · ${fmtNum(users.filter((u) => u.current_connections > 0).length)} with live connections`
              : ""}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          New user
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {filters.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "secondary" : "ghost"}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <Badge variant="outline">{f.count}</Badge>
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-60">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <Input
            placeholder="Filter by username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card className="p-0">
        {isError ? (
          <div className="p-6">
            <EmptyState
              icon={UsersIcon}
              title="Couldn't load users"
              description={describeError(error)}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead label="User" sortKey="username" sort={sort} onSort={toggleSort} />
                <TableHead>Status</TableHead>
                <SortableHead
                  label="Conns"
                  sortKey="current_connections"
                  sort={sort}
                  onSort={toggleSort}
                  className="text-right"
                />
                <SortableHead
                  label="IPs"
                  sortKey="active_unique_ips"
                  sort={sort}
                  onSort={toggleSort}
                  className="text-right"
                />
                <SortableHead
                  label="Total"
                  sortKey="total_octets"
                  sort={sort}
                  onSort={toggleSort}
                  className="text-right"
                />
                <SortableHead label="Quota" sortKey="quota" sort={sort} onSort={toggleSort} />
                <SortableHead
                  label="Expires"
                  sortKey="expiration"
                  sort={sort}
                  onSort={toggleSort}
                />
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8} className="p-0">
                    <EmptyState
                      icon={UsersIcon}
                      title={users && users.length > 0 ? "No users match" : "No users configured"}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((u) => (
                  <TableRow
                    key={u.username}
                    className="cursor-pointer"
                    onClick={() => setSelectedUsername(u.username)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn("font-mono text-sm", !u.enabled && "text-muted-foreground")}
                        >
                          {u.username}
                        </span>
                        {u.user_ad_tag && (
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {u.user_ad_tag.slice(0, 8)}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={u.enabled}
                        disabled={setEnabled.isPending}
                        onCheckedChange={(checked) =>
                          setEnabled.mutate({ username: u.username, enabled: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {u.current_connections > 0 ? (
                        fmtNum(u.current_connections)
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {u.active_unique_ips > 0 ? (
                        fmtNum(u.active_unique_ips)
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {fmtBytes(u.total_octets)}
                    </TableCell>
                    <TableCell>
                      <QuotaCell user={u} />
                    </TableCell>
                    <TableCell>
                      <ExpiresCell iso={u.expiration_rfc3339} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                          <MoreHorizontal />
                          <span className="sr-only">Actions for {u.username}</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setConfirmAction({ kind: "rotate-secret", username: u.username })
                            }
                          >
                            <KeyRound />
                            Rotate secret
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setConfirmAction({ kind: "reset-quota", username: u.username })
                            }
                          >
                            <RotateCcw />
                            Reset quota
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() =>
                              setConfirmAction({ kind: "delete", username: u.username })
                            }
                          >
                            <Trash2 />
                            Delete user
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <CreateUserDialog instanceId={instanceId} open={createOpen} onOpenChange={setCreateOpen} />

      <UserDetailSheet
        instanceId={instanceId}
        user={selectedUser}
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUsername(null)}
        onRequestDelete={(username) => setConfirmAction({ kind: "delete", username })}
      />

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          {confirmAction && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {CONFIRM_COPY[confirmAction.kind].title(confirmAction.username)}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {CONFIRM_COPY[confirmAction.kind].description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant={CONFIRM_COPY[confirmAction.kind].destructive ? "destructive" : "default"}
                  onClick={handleConfirm}
                >
                  {CONFIRM_COPY[confirmAction.kind].action}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "hover:text-foreground inline-flex items-center gap-1",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        {active &&
          (sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
      </button>
    </TableHead>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Copy, ExternalLink, QrCode as QrCodeIcon, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { QrCode } from "@/components/shared/qr-code";
import { usePatchUser } from "@/components/users/queries";
import { fmtBytes, fmtBps, fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";
import { HEX32_RE } from "@/lib/telemt/schemas/users";
import type { PatchUserRequest, UserInfo } from "@/lib/telemt/schemas/users";

interface LimitsForm {
  user_ad_tag: string;
  max_tcp_conns: string;
  max_unique_ips: string;
  rate_limit_up_bps: string;
  rate_limit_down_bps: string;
  data_quota_gb: string;
  expiration: string;
}

function toFormValues(user: UserInfo): LimitsForm {
  return {
    user_ad_tag: user.user_ad_tag ?? "",
    max_tcp_conns: user.max_tcp_conns?.toString() ?? "",
    max_unique_ips: user.max_unique_ips?.toString() ?? "",
    rate_limit_up_bps: user.rate_limit_up_bps?.toString() ?? "",
    rate_limit_down_bps: user.rate_limit_down_bps?.toString() ?? "",
    data_quota_gb: user.data_quota_bytes != null ? String(user.data_quota_bytes / 1e9) : "",
    expiration: user.expiration_rfc3339 ? user.expiration_rfc3339.slice(0, 10) : "",
  };
}

function firstLink(user: UserInfo): string | null {
  return (
    user.links.classic[0] ??
    user.links.secure[0] ??
    user.links.tls[0] ??
    user.links.tls_domains[0]?.link ??
    null
  );
}

async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Couldn't copy to clipboard");
  }
}

function LinkRow({
  label,
  link,
  active,
  onShowQr,
}: {
  label: string;
  link: string;
  active: boolean;
  onShowQr: (link: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border p-2">
      <div className="min-w-0 flex-1">
        <div className="text-muted-foreground text-[11px]">{label}</div>
        <div className="truncate font-mono text-xs">{link}</div>
      </div>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={() => onShowQr(link)}
        aria-label={`Show QR for ${label}`}
      >
        <QrCodeIcon className={cn(active && "text-primary")} />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        render={<a href={link} target="_blank" rel="noreferrer" />}
      >
        <ExternalLink />
        <span className="sr-only">Open {label} link</span>
      </Button>
      <Button size="icon-sm" variant="ghost" onClick={() => copyToClipboard(link)}>
        <Copy />
        <span className="sr-only">Copy {label} link</span>
      </Button>
    </div>
  );
}

export function UserDetailSheet({
  instanceId,
  user,
  open,
  onOpenChange,
  onRequestDelete,
}: {
  instanceId: string;
  user: UserInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestDelete: (username: string) => void;
}) {
  if (!user) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent />
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <UserDetailContent
          key={user.username}
          instanceId={instanceId}
          user={user}
          onRequestDelete={onRequestDelete}
        />
      </SheetContent>
    </Sheet>
  );
}

function UserDetailContent({
  instanceId,
  user,
  onRequestDelete,
}: {
  instanceId: string;
  user: UserInfo;
  onRequestDelete: (username: string) => void;
}) {
  const patchUser = usePatchUser(instanceId);
  const [qrLink, setQrLink] = useState<string | null>(() => firstLink(user));
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields, isDirty },
  } = useForm<LimitsForm>({ defaultValues: toFormValues(user) });

  const onSubmit = (data: LimitsForm) => {
    const body: PatchUserRequest = {};
    if (dirtyFields.user_ad_tag) body.user_ad_tag = data.user_ad_tag || null;
    if (dirtyFields.max_tcp_conns) {
      body.max_tcp_conns = data.max_tcp_conns ? Number(data.max_tcp_conns) : null;
    }
    if (dirtyFields.max_unique_ips) {
      body.max_unique_ips = data.max_unique_ips ? Number(data.max_unique_ips) : null;
    }
    if (dirtyFields.rate_limit_up_bps) {
      body.rate_limit_up_bps = data.rate_limit_up_bps ? Number(data.rate_limit_up_bps) : null;
    }
    if (dirtyFields.rate_limit_down_bps) {
      body.rate_limit_down_bps = data.rate_limit_down_bps ? Number(data.rate_limit_down_bps) : null;
    }
    if (dirtyFields.data_quota_gb) {
      body.data_quota_bytes = data.data_quota_gb
        ? Math.round(Number(data.data_quota_gb) * 1e9)
        : null;
    }
    if (dirtyFields.expiration) {
      body.expiration_rfc3339 = data.expiration ? new Date(data.expiration).toISOString() : null;
    }
    if (Object.keys(body).length === 0) return;

    patchUser.mutate({ username: user.username, body }, { onSuccess: () => reset(data) });
  };

  const linkGroups: { label: string; links: string[] }[] = [
    { label: "Classic", links: user.links.classic },
    { label: "Secure (DD)", links: user.links.secure },
    { label: "EE-TLS", links: user.links.tls },
    {
      label: "TLS domain",
      links: user.links.tls_domains.map((d) => d.link),
    },
  ].filter((g) => g.links.length > 0);

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-2">
          <SheetTitle className="font-mono">{user.username}</SheetTitle>
          <Badge variant={user.enabled ? "outline" : "secondary"}>
            {user.enabled ? "Enabled" : "Disabled"}
          </Badge>
          {!user.in_runtime && <Badge variant="outline">Not in runtime</Badge>}
        </div>
        <SheetDescription>
          {fmtNum(user.current_connections)} live connections · {fmtNum(user.active_unique_ips)}{" "}
          active IPs · {fmtBytes(user.total_octets)} total
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-6 px-4 pb-4">
        {linkGroups.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="text-sm font-medium">Connection links</div>
            {qrLink && (
              <div className="flex flex-col items-center gap-1.5 py-2">
                <QrCode value={qrLink} size={140} />
                <span className="text-muted-foreground text-[11px]">scan to connect</span>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {linkGroups.map((g) =>
                g.links.map((link, i) => (
                  <LinkRow
                    key={`${g.label}-${i}`}
                    label={g.links.length > 1 ? `${g.label} ${i + 1}` : g.label}
                    link={link}
                    active={qrLink === link}
                    onShowQr={setQrLink}
                  />
                )),
              )}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No active connection links — check that a proxy mode is enabled in config.
          </p>
        )}

        <Separator />

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="text-sm font-medium">Limits &amp; policy</div>
          <p className="text-muted-foreground text-xs">
            Clear a field to remove its per-user override.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="d-max_tcp_conns">max_tcp_conns</Label>
              <Input
                id="d-max_tcp_conns"
                type="number"
                min={0}
                placeholder="unlimited"
                {...register("max_tcp_conns")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="d-max_unique_ips">max_unique_ips</Label>
              <Input
                id="d-max_unique_ips"
                type="number"
                min={0}
                placeholder="unlimited"
                {...register("max_unique_ips")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="d-rate_limit_up_bps">rate_limit_up_bps</Label>
              <Input
                id="d-rate_limit_up_bps"
                type="number"
                min={0}
                placeholder="unlimited"
                {...register("rate_limit_up_bps")}
              />
              <span className="text-muted-foreground text-[11px]">
                current: {fmtBps(user.rate_limit_up_bps)}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="d-rate_limit_down_bps">rate_limit_down_bps</Label>
              <Input
                id="d-rate_limit_down_bps"
                type="number"
                min={0}
                placeholder="unlimited"
                {...register("rate_limit_down_bps")}
              />
              <span className="text-muted-foreground text-[11px]">
                current: {fmtBps(user.rate_limit_down_bps)}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="d-data_quota_gb">data_quota_bytes (GB)</Label>
              <Input
                id="d-data_quota_gb"
                type="number"
                min={0}
                step="any"
                placeholder="unlimited"
                {...register("data_quota_gb")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="d-expiration">expiration_rfc3339</Label>
              <Input id="d-expiration" type="date" {...register("expiration")} />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="d-user_ad_tag">user_ad_tag</Label>
              <Input
                id="d-user_ad_tag"
                className="font-mono"
                placeholder="32 hex chars"
                {...register("user_ad_tag", {
                  pattern: { value: HEX32_RE, message: "exactly 32 hex chars" },
                })}
                aria-invalid={!!errors.user_ad_tag}
              />
              {errors.user_ad_tag && (
                <p className="text-destructive text-xs">{errors.user_ad_tag.message}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!isDirty}
              onClick={() => reset(toFormValues(user))}
            >
              Reset
            </Button>
            <Button type="submit" disabled={!isDirty || patchUser.isPending}>
              {patchUser.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>

        <Separator />

        <div className="flex flex-col gap-2">
          <div className="text-destructive text-sm font-medium">Danger zone</div>
          <Button variant="destructive" onClick={() => onRequestDelete(user.username)}>
            <Trash2 />
            Delete user
          </Button>
        </div>
      </div>

      <SheetFooter />
    </>
  );
}

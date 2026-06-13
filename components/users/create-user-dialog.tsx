"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateUser } from "@/components/users/queries";
import { HEX32_RE, USERNAME_RE } from "@/lib/telemt/schemas/users";
import type { CreateUserRequest } from "@/lib/telemt/schemas/users";

interface CreateUserForm {
  username: string;
  secret: string;
  user_ad_tag: string;
  max_tcp_conns: string;
  max_unique_ips: string;
  rate_limit_up_bps: string;
  rate_limit_down_bps: string;
  data_quota_gb: string;
  expiration: string;
  enabled: boolean;
}

const DEFAULT_VALUES: CreateUserForm = {
  username: "",
  secret: "",
  user_ad_tag: "",
  max_tcp_conns: "",
  max_unique_ips: "",
  rate_limit_up_bps: "",
  rate_limit_down_bps: "",
  data_quota_gb: "",
  expiration: "",
  enabled: true,
};

function genHex32() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function CreateUserDialog({
  instanceId,
  open,
  onOpenChange,
}: {
  instanceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [advanced, setAdvanced] = useState(false);
  const createUser = useCreateUser(instanceId);
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateUserForm>({ defaultValues: DEFAULT_VALUES });

  const close = () => {
    reset(DEFAULT_VALUES);
    setAdvanced(false);
    onOpenChange(false);
  };

  const onSubmit = (data: CreateUserForm) => {
    const body: CreateUserRequest = { username: data.username };
    if (data.secret) body.secret = data.secret;
    if (data.user_ad_tag) body.user_ad_tag = data.user_ad_tag;
    if (data.max_tcp_conns) body.max_tcp_conns = Number(data.max_tcp_conns);
    if (data.max_unique_ips) body.max_unique_ips = Number(data.max_unique_ips);
    if (data.rate_limit_up_bps) body.rate_limit_up_bps = Number(data.rate_limit_up_bps);
    if (data.rate_limit_down_bps) body.rate_limit_down_bps = Number(data.rate_limit_down_bps);
    if (data.data_quota_gb) body.data_quota_bytes = Math.round(Number(data.data_quota_gb) * 1e9);
    if (data.expiration) body.expiration_rfc3339 = new Date(data.expiration).toISOString();
    if (!data.enabled) body.enabled = false;

    createUser.mutate(body, {
      onSuccess: () => close(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : close())}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
            <DialogDescription>
              Provision a new proxy credential on this instance.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoFocus
              placeholder="e.g. nova_eu"
              className="font-mono"
              {...register("username", {
                required: "Username is required",
                pattern: { value: USERNAME_RE, message: "1-64 chars of [A-Za-z0-9_.-]" },
              })}
              aria-invalid={!!errors.username}
            />
            {errors.username && (
              <p className="text-destructive text-xs">{errors.username.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="secret">Secret</Label>
            <div className="flex gap-2">
              <Input
                id="secret"
                placeholder="optional — leave blank to auto-generate"
                className="font-mono"
                {...register("secret", {
                  pattern: { value: HEX32_RE, message: "exactly 32 hex chars" },
                })}
                aria-invalid={!!errors.secret}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setValue("secret", genHex32())}
              >
                <Sparkles />
                Generate
              </Button>
            </div>
            {errors.secret && <p className="text-destructive text-xs">{errors.secret.message}</p>}
          </div>

          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="enabled"
              render={({ field }) => (
                <Checkbox
                  id="enabled"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              )}
            />
            <Label htmlFor="enabled">Enabled</Label>
          </div>

          <button
            type="button"
            onClick={() => setAdvanced((a) => !a)}
            className="text-muted-foreground hover:text-foreground border-t pt-3 text-left text-xs font-medium"
          >
            {advanced ? "Hide" : "Show"} advanced limits
          </button>

          {advanced && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="max_tcp_conns">max_tcp_conns</Label>
                <Input
                  id="max_tcp_conns"
                  type="number"
                  min={0}
                  placeholder="unlimited"
                  {...register("max_tcp_conns")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="max_unique_ips">max_unique_ips</Label>
                <Input
                  id="max_unique_ips"
                  type="number"
                  min={0}
                  placeholder="unlimited"
                  {...register("max_unique_ips")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rate_limit_up_bps">rate_limit_up_bps</Label>
                <Input
                  id="rate_limit_up_bps"
                  type="number"
                  min={0}
                  placeholder="unlimited"
                  {...register("rate_limit_up_bps")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rate_limit_down_bps">rate_limit_down_bps</Label>
                <Input
                  id="rate_limit_down_bps"
                  type="number"
                  min={0}
                  placeholder="unlimited"
                  {...register("rate_limit_down_bps")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="data_quota_gb">data_quota_bytes (GB)</Label>
                <Input
                  id="data_quota_gb"
                  type="number"
                  min={0}
                  step="any"
                  placeholder="unlimited"
                  {...register("data_quota_gb")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="expiration">expiration_rfc3339</Label>
                <Input id="expiration" type="date" {...register("expiration")} />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="user_ad_tag">user_ad_tag</Label>
                <Input
                  id="user_ad_tag"
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
          )}

          <DialogFooter>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? "Creating…" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

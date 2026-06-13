"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { login, type LoginState } from "@/lib/auth/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "";
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="mb-2 flex items-center gap-2">
          <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
            <Zap className="size-4" />
          </span>
          <span className="text-base font-semibold">
            tele<b>mt</b>
          </span>
        </div>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter the shared password to access the control panel.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="from" value={from} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoFocus
              required
              aria-invalid={!!state.error}
            />
          </div>
          {state.error && <p className="text-destructive text-sm">{state.error}</p>}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

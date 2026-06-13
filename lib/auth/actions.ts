"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getEnv } from "@/lib/env";
import { INSTANCE_COOKIE } from "@/lib/instance";
import { createSessionToken, safeEqual, SESSION_COOKIE, SESSION_MAX_AGE } from "./session";

export interface LoginState {
  error?: string;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const { appPassword } = getEnv();

  if (!safeEqual(password, appPassword)) {
    return { error: "Incorrect password." };
  }

  // Mark the cookie Secure only when we know the client is on HTTPS (via a
  // TLS-terminating reverse proxy). Gating on NODE_ENV alone breaks plain-HTTP
  // production deployments: browsers silently drop Secure cookies over HTTP,
  // which causes an infinite login redirect loop.
  const secure = (await headers()).get("x-forwarded-proto") === "https";

  (await cookies()).set(SESSION_COOKIE, createSessionToken(appPassword), {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  // Redirect straight to /dashboard rather than "/": the root page itself
  // redirects to /dashboard, and a second redirect chained onto a server
  // action's response trips Next's RSC fetch into an "unexpected response
  // from server" error on the client.
  const from = String(formData.get("from") ?? "");
  redirect(from.startsWith("/") ? from : "/dashboard");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

export async function setInstance(id: string) {
  const { instances } = getEnv();
  if (!instances.some((i) => i.id === id)) return;

  (await cookies()).set(INSTANCE_COOKIE, id, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  revalidatePath("/", "layout");
}

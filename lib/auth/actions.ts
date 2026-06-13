"use server";

import { cookies } from "next/headers";
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

  (await cookies()).set(SESSION_COOKIE, createSessionToken(appPassword), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  const from = String(formData.get("from") ?? "");
  redirect(from.startsWith("/") ? from : "/");
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

import { createHmac, timingSafeEqual } from "node:crypto";

/** Cookie holding the signed session token (see `createSessionToken`). */
export const SESSION_COOKIE = "telemt_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Constant-time string comparison (lengths must match to be equal). */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** `<expiry-epoch-seconds>.<hmac>`, signed with `APP_PASSWORD` so no server-side session store is needed. */
export function createSessionToken(secret: string): string {
  const payload = String(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE);
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token: string | undefined | null, secret: string): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!safeEqual(sig, sign(payload, secret))) return false;
  const expires = Number(payload);
  return Number.isFinite(expires) && Date.now() / 1000 < expires;
}

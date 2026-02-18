import { createHmac, timingSafeEqual } from "node:crypto";
type CookieStoreLike = {
  get(name: string): { value: string } | undefined;
};

export const ADMIN_COOKIE_NAME = "bom_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;

function sessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || "change-me-in-env";
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createAdminSessionToken(username: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS;
  const payload = `${username}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function isAdminSessionValid(token: string | undefined): boolean {
  if (!token) return false;

  const [username, expiresAt, signature] = token.split(".");
  if (!username || !expiresAt || !signature) return false;

  const exp = Number(expiresAt);
  if (!Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) return false;

  const payload = `${username}.${expiresAt}`;
  const expected = sign(payload);

  const signatureBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (signatureBuf.length !== expectedBuf.length) return false;

  return timingSafeEqual(signatureBuf, expectedBuf);
}

export function hasAdminSession(cookies: CookieStoreLike): boolean {
  const token = cookies.get(ADMIN_COOKIE_NAME)?.value;
  return isAdminSessionValid(token);
}

export function adminCredentials() {
  return {
    username: process.env.ADMIN_PANEL_USERNAME || "bomadmin",
    password: process.env.ADMIN_PANEL_PASSWORD || "epstein",
  };
}

export function adminSessionTtlSeconds() {
  return ADMIN_SESSION_TTL_SECONDS;
}


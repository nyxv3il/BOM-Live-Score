import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  adminCredentials,
  adminSessionTtlSeconds,
  createAdminSessionToken,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { username?: string; password?: string }
    | null;

  const username = body?.username?.trim() || "";
  const password = body?.password || "";

  const valid = adminCredentials();
  if (username !== valid.username || password !== valid.password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: createAdminSessionToken(username),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: adminSessionTtlSeconds(),
  });

  return res;
}


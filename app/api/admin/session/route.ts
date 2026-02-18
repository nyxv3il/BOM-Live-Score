import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const cookieStore = await cookies();
  return NextResponse.json({ authenticated: hasAdminSession(cookieStore) });
}


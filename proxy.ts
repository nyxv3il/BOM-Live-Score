import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const adminSession = request.cookies.get("admin_session")?.value;

  if (!adminSession && request.nextUrl.pathname.startsWith("/admin/dashboard")) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*"],
};

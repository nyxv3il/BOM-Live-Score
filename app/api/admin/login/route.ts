import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { username, password } = (await request.json()) as {
    username?: string;
    password?: string;
  };

  const adminUsername = process.env.ADMIN_PANEL_USERNAME;
  const adminPassword = process.env.ADMIN_PANEL_PASSWORD;

  if (!adminUsername || !adminPassword) {
    return NextResponse.json(
      { message: "Admin credentials are not configured." },
      { status: 500 },
    );
  }

  if (username === adminUsername && password === adminPassword) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
}

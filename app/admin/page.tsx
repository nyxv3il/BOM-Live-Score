import { cookies } from "next/headers";
import AdminPanel from "./AdminPanel";
import { hasAdminSession } from "@/lib/admin-auth";

export default async function AdminPage() {
  const cookieStore = await cookies();
  return <AdminPanel initialAuthenticated={hasAdminSession(cookieStore)} />;
}


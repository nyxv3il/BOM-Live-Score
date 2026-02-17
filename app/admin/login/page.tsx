"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

function LoginForm() {
  const [username, setUser] = useState("");
  const [password, setPass] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTarget = searchParams.get("next") || "/admin/dashboard";

  useEffect(() => {
    const adminSession = Cookies.get("admin_session");
    if (adminSession === "true") {
      router.replace(redirectTarget);
    }
  }, [redirectTarget, router]);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (username === "bomadmin" && password === "epstein") {
      Cookies.set("admin_session", "true", {
        path: "/",
        secure: window.location.protocol === "https:",
        sameSite: "strict",
      });
      router.push(redirectTarget);
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen px-4 py-12 flex items-center justify-center">
      <form onSubmit={handleLogin} className="login-card w-full max-w-md p-10 rounded-2xl">
        <h2 className="login-title text-4xl font-black mb-2 text-center neon-text">ADMIN</h2>
        <p className="login-subtitle text-lg mb-10 text-center">Secure Login Required</p>

        <div className="space-y-6">
          <div>
            <label className="login-label block text-xs font-bold uppercase tracking-widest mb-3">
              Username
            </label>
            <input
              className="login-input p-3 w-full rounded-lg"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUser(e.target.value)}
            />
          </div>

          <div>
            <label className="login-label block text-xs font-bold uppercase tracking-widest mb-3">
              Password
            </label>
            <input
              className="login-input p-3 w-full rounded-lg"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPass(e.target.value)}
            />
          </div>

          <button className="login-btn w-full py-3 rounded-lg font-black text-lg uppercase tracking-wider mt-8" type="submit">
            <i className="fas fa-lock"></i> LOGIN
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

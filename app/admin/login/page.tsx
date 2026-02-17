"use client";
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

function LoginForm() {
  const [username, setUser] = useState("");
  const [password, setPass] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Simple client-side check for demo. In production, use a Server Action.
    // We are matching against values you can hardcode here or fetch from an API.
    if (username === "bomadmin" && password === "epstein") {
      Cookies.set("admin_session", "true");
      router.push(searchParams.get("next") || "/admin/dashboard");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md p-10 rounded-2xl neon-card"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
      >
        <h2
          className="text-4xl font-black mb-2 neon-text text-center"
          style={{ color: "var(--primary)" }}
        >
          ADMIN
        </h2>
        <p
          className="text-lg mb-10 text-center"
          style={{ color: "var(--purple)" }}
        >
          Secure Login Required
        </p>

        <div className="space-y-6">
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--silver)" }}
            >
              Username
            </label>
            <input
              className="p-3 w-full rounded-lg focus:outline-none transition-all"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUser(e.target.value)}
              style={{
                backgroundColor: "var(--input)",
                color: "var(--silver)",
                border: "2px solid var(--border)",
              }}
            />
          </div>

          <div>
            <label
              className="block text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--silver)" }}
            >
              Password
            </label>
            <input
              className="p-3 w-full rounded-lg focus:outline-none transition-all"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPass(e.target.value)}
              style={{
                backgroundColor: "var(--input)",
                color: "var(--silver)",
                border: "2px solid var(--border)",
              }}
            />
          </div>

          <button
            className="w-full py-3 rounded-lg font-black text-lg uppercase tracking-wider transition-all duration-300 border-2 mt-8"
            style={{
              backgroundColor: "var(--primary)",
              color: "#fff",
              borderColor: "var(--primary)",
              boxShadow: "0 0 20px rgba(128, 0, 32, 0.22)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 32px rgba(128, 0, 32, 0.35), inset 0 0 10px rgba(201, 151, 26, 0.22)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 20px rgba(128, 0, 32, 0.22)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            🔐 LOGIN
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

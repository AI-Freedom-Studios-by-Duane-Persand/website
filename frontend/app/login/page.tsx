// frontend/app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseJwt } from "../../lib/parseJwt";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Only set isAuthenticated state on mount
  useEffect(() => {
    let token: string | null = null;
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
      if (match) token = match[1];
    }
    if (!token && typeof window !== "undefined") {
      token = localStorage.getItem("token");
    }
    setIsAuthenticated(!!token);
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      // Save JWT token to localStorage
      if (data.token) {
        localStorage.setItem("token", data.token);
        document.cookie = `auth_token=${data.token}; path=/; SameSite=Lax;`;
        setIsAuthenticated(true);

        console.log("[LOGIN] Set localStorage token:", localStorage.getItem("token"));
        console.log("[LOGIN] Set cookie:", document.cookie);

        const payload = parseJwt(data.token);
        console.log("[LOGIN] JWT payload after login:", payload);

        const cookieMatch = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
        console.log("[LOGIN] Cookie match:", cookieMatch ? cookieMatch[1] : null);

        if (payload) {
          const role = payload.role;
          const roles = Array.isArray(payload.roles) ? payload.roles : [payload.role];
          const isAdmin =
            role === "superadmin" ||
            role === "admin" ||
            roles.includes("superadmin") ||
            roles.includes("admin");

          console.log("[LOGIN] Redirect decision:", { role, roles, isAdmin });

          if (isAdmin) {
            try {
              console.log('[LOGIN] Attempting router.replace("/admin")');
              router.replace("/admin");
              setTimeout(() => {
                console.log('[LOGIN] After router.replace("/admin")');
              }, 1000);
            } catch (navErr) {
              setError("Navigation to /admin failed.");
              console.error("[LOGIN] Navigation to /admin failed:", navErr);
            }
            return;
          }
        }

        try {
          console.log('[LOGIN] Attempting router.replace("/app/dashboard")');
          router.replace("/app/dashboard");
          setTimeout(() => {
            console.log('[LOGIN] After router.replace("/app/dashboard")');
          }, 1000);
        } catch (navErr) {
          setError("Navigation to dashboard failed.");
          console.error("[LOGIN] Navigation to dashboard failed:", navErr);
        }
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  }

  // Keeping the function for future use, but no Sign Out button in UI
  function handleSignOut() {
    localStorage.removeItem("token");
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.reload();
  }

  return (
    <main
      className="
        min-h-screen flex flex-col items-center justify-center px-4
        bg-gradient-to-br from-[#fde7e1] via-[#fff8ec] to-[#e6f0ff]
      "
    >
      {/* Branding */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mt-20">Sign in to your account</h2>
        <p className="text-gray-600 text-sm mt-1">
          Welcome back to AI Freedom Studios
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="
                w-full px-4 py-3 rounded-lg border border-gray-300
                focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                outline-none transition
              "
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="
                w-full px-4 py-3 rounded-lg border border-gray-300
                focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                outline-none transition
              "
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          {/* Sign In button */}
          <button
            type="submit"
            className="
              w-full py-3 rounded-lg font-semibold text-white
              bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb]
              hover:opacity-95 shadow-md transition
            "
          >
            Sign In
          </button>
        </form>

        {/* Sign up link */}
        <p className="text-center text-sm mt-4 text-gray-600">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-blue-600 hover:underline">
            Sign up
          </a>
        </p>
      </div>

      {/* Back to homepage */}
      <a
        href="/"
        className="mt-10 text-sm text-gray-600 hover:text-gray-900 transition"
      >
        ← Back to homepage
      </a>
    </main>
  );
}

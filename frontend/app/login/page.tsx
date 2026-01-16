// frontend/app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "../../lib/api/auth.api";
import { apiClient } from "../../lib/api/client";

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
      const res = await authApi.login({ email, password });
      const token = res.access_token || res.token;
      if (!token) throw new Error("Login failed: no token");

      // Persist token for transitional client-side checks and middleware
      try {
        localStorage.setItem("token", token);
        document.cookie = `auth_token=${token}; path=/; SameSite=Lax;`;
      } catch {}
      setIsAuthenticated(true);

      const payload = apiClient.parseToken();
      const role = payload?.role;
      const roles = Array.isArray(payload?.roles) ? payload?.roles : role ? [role] : [];
      const isAdmin = roles.includes("superadmin") || roles.includes("admin") || role === "superadmin" || role === "admin";

      if (isAdmin) {
        router.replace("/admin");
        return;
      }
      router.replace("/app/dashboard");
    } catch (err: any) {
      setError(err?.message || "Login failed");
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
              placeholder="you@company.com"
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

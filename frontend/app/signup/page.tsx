"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseJwt } from "../../lib/parseJwt";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let token = null;
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
      if (match) token = match[1];
    }
    if (!token && typeof window !== "undefined") {
      token = localStorage.getItem("token");
    }
    if (token) {
      const payload = parseJwt(token);
      if (payload) {
        const roles = Array.isArray(payload.roles)
          ? payload.roles
          : [payload.role];

        if (roles.includes("superadmin") || roles.includes("admin")) {
          router.replace("/admin");
          return;
        }
        router.replace("/app/dashboard");
      }
    }
  }, [router]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiUrl}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, tenant: tenantName }),
      });

      if (!res.ok) throw new Error("Signup failed");

      router.push("/app/dashboard");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    }
  }

  return (
    <main
      className="
        min-h-screen flex flex-col items-center justify-center px-4
        bg-gradient-to-br from-[#fde7e1] via-[#fff8ec] to-[#e6f0ff]
      "
    >
      {/* Branding */}
      <div className="text-center mb-8 mt-20">
        <h2 className="text-3xl font-bold mt-3">Create your account</h2>
        <p className="text-gray-600 text-sm mt-1">
          Join AI Freedom Studios today
        </p>
      </div>

      {/* Card */}
      <div
        className="
          w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-100
        "
      >
        <form onSubmit={handleSignup} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="text-sm font-medium text-gray-700">Tenant Name</label>
            <input
              type="text"
              placeholder="Company or Brand Name"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              required
              className="
                w-full px-4 py-3 rounded-lg border border-gray-300
                focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                outline-none transition
              "
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700">Email Address</label>
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
            <label className="text-sm font-medium text-gray-700">Password</label>
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

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="
              w-full py-3 rounded-lg font-semibold text-white
              bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb]
              hover:opacity-95 shadow-md transition
            "
          >
            Create Account
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-sm mt-4 text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Sign in
          </a>
        </p>
      </div>

      {/* Back Link */}
      <a
        href="/"
        className="mt-10 text-sm text-gray-600 hover:text-gray-900 transition"
      >
        ← Back to homepage
      </a>
    </main>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SubscriptionPanel from "./SubscriptionPanel";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    console.log("DEBUG: Calling API URL:", `${apiUrl}/api/auth/me`);

    function getAuthHeaders() {
      if (typeof window === "undefined") return {};
      const token = localStorage.getItem("token");
      return token ? { Authorization: `Bearer ${token}` } : {};
    }

    fetch(`${apiUrl}/api/auth/me`, {
      credentials: "include",
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load user info");
        setLoading(false);
      });
  }, [router]);

  return (
    <main
      className="
        min-h-screen
        bg-gradient-to-br from-[#fde7e1] via-[#fff8ec] to-[#e6f0ff]
        pt-24 pb-16 px-4
      "
    >
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Page heading */}
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Welcome to your studio
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-600">
            Manage your account, subscription, and campaigns from one place.
          </p>
        </header>

        {/* Main content */}
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-start">
          {/* User summary card */}
          <section
            className="
              bg-white rounded-2xl shadow-lg border border-gray-100
              p-8
            "
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 mb-4">
              Dashboard
            </div>

            {loading ? (
              <div className="text-center text-gray-500">Loading...</div>
            ) : error ? (
              <div className="text-center text-red-500 text-sm">{error}</div>
            ) : (
              <div className="space-y-6">
                <div className="text-left">
                  <p className="text-sm text-slate-500">Signed in as</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 break-all">
                    {user?.email || "User"}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Role
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {user?.role || "Standard"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Subscription
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {user?.subscriptionStatus || "Not active"}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  Your access and features are based on your role and
                  subscription status. Upgrade anytime from the subscription
                  panel.
                </div>
              </div>
            )}
          </section>

          {/* Subscription panel wrapper (UI only, logic inside component stays same) */}
          <section
            className="
              bg-white rounded-2xl shadow-lg border border-gray-100
              p-6
            "
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Subscription & Billing
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Review your current plan, update billing, or start your free
              trial.
            </p>
            <SubscriptionPanel />
          </section>
        </div>
      </div>
    </main>
  );
}
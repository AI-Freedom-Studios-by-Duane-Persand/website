"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SubscriptionPanel from "./SubscriptionPanel";
import CampaignsPanel from "./CampaignsPanel";
import SocialConnectionsCard from "../components/SocialConnectionsCard";
import EarlyAccessGate from "../../components/EarlyAccessGate";
import SubscriptionGate from "../../components/SubscriptionGate";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      console.warn("No token found. Redirecting to homepage.");
      router.push("/");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
    console.log("DEBUG: Calling API URL:", `${apiUrl}/api/auth/me`);

    function getAuthHeaders(): Record<string, string> {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      return token ? { Authorization: `Bearer ${token}` } : {};
    }

    fetch(`${apiUrl}/api/auth/me`, {
      credentials: "include",
      headers: getAuthHeaders(),
    })
      .then((res) => {
        console.log("DEBUG: Response status:", res.status);
        if (!res.ok) {
          throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("DEBUG: User data received:", data);
        setUser(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("ERROR: Failed to fetch user info:", err);
        setError(err.message || "Failed to load user info");
        setLoading(false);
      });
  }, [router]);

  const roleLabel = useMemo(() => {
    console.log("DEBUG: Calculating role label:", user?.role);
    return user?.role || "Standard";
  }, [user]);

  const subLabel = useMemo(() => {
    console.log("DEBUG: Calculating subscription label:", user?.subscriptionStatus);
    return user?.subscriptionStatus || "Not active";
  }, [user]);

  const emailLabel = useMemo(() => {
    console.log("DEBUG: Calculating email label:", user?.email);
    return user?.email || "User";
  }, [user]);

  const subTone =
    subLabel === "active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : subLabel === "canceled"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  const hasEarlyAccess = user?.isEarlyAccess === true;

  return (
    <EarlyAccessGate hasAccess={hasEarlyAccess}>
      <SubscriptionGate>
      <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#020617] pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Page header */}
        <header className="text-white">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome to your studio
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Manage campaigns, creatives, and billing from one place.
          </p>
        </header>

        {/* Alerts */}
        {error && !loading && (
          <div
            role="alert"
            className="rounded-2xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3"
          >
            {error}
          </div>
        )}

        {/* User row (single-line / compact) */}
        <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur shadow-xl overflow-hidden">
          <div className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#ef4444] via-[#f97316] to-[#2563eb] flex items-center justify-center text-white font-extrabold shadow-sm">
                AI
              </div>

              <div className="min-w-0">
                <div className="text-xs text-slate-300">Signed in as</div>
                <div className="text-sm md:text-base font-semibold text-white truncate">
                  {loading ? "Loading…" : emailLabel}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-white/10 bg-white/5 text-slate-200">
                Role: <span className="ml-1 text-white">{loading ? "…" : roleLabel}</span>
              </span>

              <span
                className={[
                  "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border",
                  subTone,
                ].join(" ")}
              >
                Subscription:{" "}
                <span className="ml-1 font-extrabold">{loading ? "…" : subLabel}</span>
              </span>

              <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-white/10 bg-white/5 text-slate-200">
                Studio
              </span>
            </div>
          </div>
        </section>

        {/* Social connections quick card */}
        <SocialConnectionsCard
          title="Connect accounts for publishing"
          subtitle="Link your social profiles once and reuse them across campaigns and scheduling."
          compact
        />

        {/* Main layout */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] items-start">
          {/* Campaigns (emphasized, modern) */}
          <section className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow-2xl overflow-hidden">
            {/* glow */}
            <div className="absolute inset-x-0 -top-28 h-56 bg-gradient-to-r from-[#ef4444]/25 via-[#f97316]/20 to-[#2563eb]/25 blur-3xl" />

            <div className="relative p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                    <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb]" />
                    Campaigns
                  </div>

                  <h2 className="mt-3 text-xl md:text-2xl font-extrabold text-white tracking-tight">
                    Create and manage campaigns
                  </h2>
                  <p className="mt-1 text-sm text-slate-300 max-w-2xl">
                    Launch a new campaign, update objectives, and track status — all from one place.
                  </p>
                </div>

                {/* visual CTA (pure UI; no logic changes) */}
                <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs text-slate-300">Quick action</div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    Create Campaign ↓
                  </div>
                </div>
              </div>

              {/* Panel content */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
                <CampaignsPanel />
              </div>

              {/* helper row */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-white/5">
                  Tip: Use clear objectives
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-white/5">
                  Keep names consistent
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-white/5">
                  Iterate fast
                </span>
              </div>
            </div>
          </section>

          {/* Subscription */}
          <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow-2xl overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
                    Subscription & Billing
                  </h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Review your plan, billing status, and upgrade options.
                  </p>
                </div>

                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-white/10 bg-white/5 text-slate-200">
                  Billing
                </span>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
                <SubscriptionPanel />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
      </SubscriptionGate>
    </EarlyAccessGate>
  );
}
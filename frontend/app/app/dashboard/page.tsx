"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CampaignsPanel from "./CampaignsPanel";
import SocialConnectionsCard from "../components/SocialConnectionsCard";
import EarlyAccessGate from "../../components/EarlyAccessGate";
import SubscriptionGate from "../../components/SubscriptionGate";
import { authApi } from "@/lib/api/auth.api";
import { subscriptionsApi } from "@/lib/api/subscriptions.api";
import { apiClient } from "@/lib/api/client";
import { parseApiError, getUserMessage } from "@/lib/error-handler";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

async function checkSubscription() {
  try {
    const current = await subscriptionsApi.getCurrentSubscription();
    const status = (current as any)?.status;
    setIsSubscribed(Boolean(status === 'active' || status === 'trialing' || status === true));
  } catch (err) {
    setIsSubscribed(false);
  }
}

  useEffect(() => {
    const tokenJwt = apiClient.parseToken();
    if (!tokenJwt) {
      console.warn("No token found. Redirecting to homepage.");
      router.push("/");
      return;
    }
    (async () => {
      try {
        const me = await authApi.getCurrentUser();
        setUser(me);
        setLoading(false);
        checkSubscription();
      } catch (err) {
        const parsed = parseApiError(err);
        console.error("ERROR: Failed to fetch user info:", parsed);
        setError(getUserMessage(parsed));
        setLoading(false);
      }
    })();
  }, [router]);

  const roleLabel = useMemo(() => {
    console.log("DEBUG: Calculating role label:", user?.role);
    return user?.role || "Standard";
  }, [user]);
  
const subLabel = useMemo(() => {
  return isSubscribed ? "active" : "inactive";
}, [isSubscribed]);

  const emailLabel = useMemo(() => {
    console.log("DEBUG: Calculating email label:", user?.email);
    return user?.email || "User";
  }, [user]);

  const subTone =
    subLabel === "active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  const hasEarlyAccess = user?.isEarlyAccess === true;

  return (
    <EarlyAccessGate hasAccess={hasEarlyAccess}>
      <SubscriptionGate>
      <main className="min-h-screen bg-gradient-to-br from-[#0c1f24] via-[#0a262b] to-[#0f2e35] pt-24 pb-16 px-4">
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
      </div>
    </main>
      </SubscriptionGate>
    </EarlyAccessGate>
  );
}
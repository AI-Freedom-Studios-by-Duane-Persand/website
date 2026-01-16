"use client";

import React, { useEffect, useState } from "react";
import SubscriptionPanel from "../../app/dashboard/SubscriptionPanel";
import { subscriptionsApi, apiClient } from "../../../lib/api";

interface SubscriptionGateProps {
  children: React.ReactNode;
}

/**
 * Gate that shows the subscription paywall for users without an active plan.
 * Mirrors EarlyAccessGate UX: if not subscribed, we only show the subscription panel.
 */
export default function SubscriptionGate({ children }: SubscriptionGateProps) {
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const token = apiClient.parseToken();
    if (!token) {
      setHasSubscription(false);
      setLoading(false);
      return;
    }

    subscriptionsApi
      .getCurrentSubscription()
      .then((data: any) => {
        const status = data?.status || data?.subscription?.status;
        setHasSubscription(status === "active");
        setLoading(false);
      })
      .catch((err) => {
        console.error("[SubscriptionGate] Failed to load subscription status", err);
        setError("Unable to verify subscription. Please refresh.");
        setHasSubscription(false);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="animate-pulse text-sm">Checking your subscription…</div>
      </div>
    );
  }

  if (!hasSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fde7e1] via-[#fff8ec] to-[#e6f0ff] flex items-center justify-center px-4 py-16">
        <div className="max-w-5xl w-full">
          <div className="bg-white backdrop-blur-xl rounded-2xl border border-white/15 p-6 md:p-10 mt-28 md:mt-12 shadow-2xl">
            <div className="text-center mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-black">
                Activate your subscription
              </h1>
              <p className="mt-3 text-slate-200/80 text-black md:text-lg">
                Subscribe to unlock the campaign workspace. Early access is enabled on your
                account; choose a plan to continue.
              </p>
              {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
            </div>
            <SubscriptionPanel />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

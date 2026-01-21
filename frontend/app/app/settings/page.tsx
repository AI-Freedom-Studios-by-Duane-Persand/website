"use client";
import React from "react";
import SocialConnectionsCard from "../components/SocialConnectionsCard";
import EarlyAccessGate from "../../components/EarlyAccessGate";
import SubscriptionGate from "../../components/SubscriptionGate";
import { useAuth } from "../../hooks/useAuth";

export default function SocialAccounts() {
  const { hasEarlyAccess } = useAuth();
  
  return (
    <EarlyAccessGate hasAccess={hasEarlyAccess}>
      <SubscriptionGate>
        <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#020617] px-4 py-8 text-white">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Settings</p>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Social accounts</h1>
          <p className="text-sm text-slate-300">
            Connect once and reuse across campaigns, publishing, and scheduling. Powered by Meta.
          </p>
        </header>

        <SocialConnectionsCard />
      </div>
        </main>
      </SubscriptionGate>
    </EarlyAccessGate>
  );
}
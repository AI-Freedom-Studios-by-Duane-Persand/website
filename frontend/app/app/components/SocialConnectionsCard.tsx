"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getAuthHeaders } from "@/lib/utils/auth-headers";

const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";

export type SocialConnectionsCardProps = {
  title?: string;
  subtitle?: string;
  compact?: boolean;
};

type SocialAccount = {
  _id: string;
  platform: string;
  pageId?: string;
  pageName?: string;
  instagramAccountId?: string;
  instagramUsername?: string;
  isActive: boolean;
};

type ConnectedPlatforms = {
  [platform: string]: SocialAccount[];
};

const platformConfig: { id: string; label: string; color: string }[] = [
  { id: "facebook", label: "Facebook", color: "from-[#2563eb] to-[#60a5fa]" },
  { id: "instagram", label: "Instagram", color: "from-[#f97316] to-[#f43f5e]" },
  { id: "twitter", label: "Twitter", color: "from-[#0ea5e9] to-[#38bdf8]" },
  { id: "linkedin", label: "LinkedIn", color: "from-[#2563eb] to-[#60a5fa]" },
  { id: "youtube", label: "YouTube", color: "from-[#ef4444] to-[#f97316]" },
  { id: "tiktok", label: "TikTok", color: "from-[#14b8a6] to-[#22d3ee]" },
];

export default function SocialConnectionsCard({
  title = "Connect your social accounts",
  subtitle = "Publish faster by connecting once. We'll reuse the connection across campaigns and scheduling.",
  compact = false,
}: SocialConnectionsCardProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const activePlatforms = useMemo(() => {
    const platforms = new Set<string>();
    accounts.forEach((acc) => {
      if (acc.isActive) {
        platforms.add(acc.platform);
      }
    });
    return platforms;
  }, [accounts]);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
    
      const res = await fetch(`${API_BASE_URL}/social-accounts-manager/accounts`, {
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) throw new Error(`Failed to fetch accounts (${res.status})`);
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || "Unable to load connected accounts");
    } finally {
      setLoading(false);
    }
  }, []);

 const handleConnect = useCallback(async () => {
  setConnecting(true);
  setError(null);

  try {
    const state = crypto.randomUUID?.() || Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0')).join('');

    sessionStorage.setItem('meta_oauth_state', state);

    
    //TODO: Remove the hard code , Call backend to generate URL
    const res = await fetch('http://localhost:3001/api/meta/auth/url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          appId: '1446935900283273',
        appSecret: 'e685e72595a48da1439a945424009f0b',
        // appId: process.env.NEXT_PUBLIC_META_APP_ID,
        // appSecret: process.env.NEXT_PUBLIC_META_APP_SECRET,
        redirectUri: `${window.location.origin}/auth/meta/callback`,
        state,
      }),
    });
    const data = await res.json();
    if (!data.url) throw new Error('Failed to get OAuth URL');

    // Redirect user
    window.location.href = data.url;
  } catch (err: any) {
    setError(err.message || 'Failed to start connection');
    setConnecting(false);
  }
}, []);


  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-slate-600/10 bg-white/20 backdrop-blur shadow-2xl ${
        compact ? "p-4" : "p-6 md:p-8"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#ef4444]/10 via-[#f97316]/10 to-[#2563eb]/10 blur-2xl" />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3 flex-col sm:flex-row">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-600/10 bg-white/20 px-3 py-1 text-[11px] font-semibold text-slate-600">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb]" />
              Social Connections
            </div>
            <h3 className="mt-2 text-lg md:text-xl font-bold text-black tracking-tight">{title}</h3>
            <p className="text-sm text-slate-600 max-w-2xl">{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleConnect}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb] shadow-lg hover:opacity-95 transition disabled:opacity-60"
              disabled={connecting}
            >
              {connecting ? "Opening…" : "Connect accounts"}
            </button>
            <button
              type="button"
              onClick={fetchProfiles}
              className="inline-flex items-center justify-center px-3 py-2 rounded-2xl text-xs font-semibold border border-slate-600/10 bg-white/20 text-slate-600 hover:border-white/20 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {platformConfig.map((platform) => {
            const connected = activePlatforms.has(platform.id);
            return (
              <div
                key={platform.id}
                className={`rounded-2xl border px-3 py-3 text-center shadow-lg backdrop-blur transition ${
                  connected
                    ? "border-emerald-400/30 bg-emerald-400/10"
                    : "border-slate-600/10 bg-white/40"
                }`}
              >
                <div
                  className={`mx-auto h-10 w-10 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center text-xs font-bold text-white shadow`}
                >
                  {platform.label.substring(0, 2)}
                </div>
                <div className="mt-2 text-sm font-semibold text-black/80">{platform.label}</div>
                <div className={`text-xs ${connected ? "text-emerald-200" : "text-slate-400"}`}>
                  {connected ? "Connected" : "Not connected"}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-600/10 bg-white/40 p-4 space-y-2 text-sm text-slate-600">
          <div className="font-semibold text-black">How it works</div>
          <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600">
            <li>Click "Connect accounts" to authenticate with Meta (Facebook/Instagram).</li>
            <li>Sign in to your Meta account and approve access to your Pages and Instagram accounts.</li>
            <li>Return here and hit Refresh to see your connected status.</li>
          </ol>
          {loading && <div className="text-xs text-slate-400">Loading connections…</div>}
          {!loading && accounts.length > 0 && (
            <div className="text-xs text-emerald-200">{accounts.length} account(s) connected.</div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" &&
    (localStorage.getItem("token") || localStorage.getItem("auth_token"));
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type SocialConnectionsCardProps = {
  title?: string;
  subtitle?: string;
  compact?: boolean;
};

type AyrshareProfile = {
  profileKey: string;
  platforms: string[];
  activePlatforms?: string[];
  title?: string;
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
  subtitle = "Publish faster by connecting once. We’ll reuse the connection across campaigns and scheduling.",
  compact = false,
}: SocialConnectionsCardProps) {
  const [profiles, setProfiles] = useState<AyrshareProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const activePlatforms = useMemo(() => {
    const platforms = new Set<string>();
    profiles.forEach((p) => (p.activePlatforms || p.platforms || []).forEach((pl) => platforms.add(pl)));
    return platforms;
  }, [profiles]);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/social-accounts/profiles`, {
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) throw new Error(`Failed to fetch profiles (${res.status})`);
      const data = await res.json();
      setProfiles(Array.isArray(data) ? data : data?.profiles || []);
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
      // Use Meta (Facebook) OAuth to connect Facebook Pages and Instagram accounts
      const appId = process.env.NEXT_PUBLIC_META_APP_ID;
      const redirectUri = `${window.location.origin}/api/auth/meta/callback`;
      // Cryptographically secure CSRF state token
      const state = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      
      if (!appId) {
        throw new Error('Meta App ID not configured');
      }
      
      // Store state in session storage for verification in callback
      sessionStorage.setItem('meta_oauth_state', state);
      
      // Generate OAuth URL
      const scope = 'pages_manage_posts,pages_manage_engagement,pages_read_engagement,instagram_basic,instagram_content_publish';
      const authUrl = `https://www.facebook.com/v24.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}&response_type=code`;
      
      // Redirect to Meta OAuth
      window.location.href = authUrl;
    } catch (err: any) {
      setError(err?.message || "Unable to start connection flow");
      setConnecting(false);
    }
  }, []);


  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow-2xl ${
        compact ? "p-4" : "p-6 md:p-8"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#ef4444]/10 via-[#f97316]/10 to-[#2563eb]/10 blur-2xl" />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3 flex-col sm:flex-row">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-200">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb]" />
              Social Connections
            </div>
            <h3 className="mt-2 text-lg md:text-xl font-extrabold text-white tracking-tight">{title}</h3>
            <p className="text-sm text-slate-300 max-w-2xl">{subtitle}</p>
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
              className="inline-flex items-center justify-center px-3 py-2 rounded-2xl text-xs font-semibold border border-white/10 bg-white/5 text-slate-200 hover:border-white/20 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
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
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div
                  className={`mx-auto h-10 w-10 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center text-xs font-bold text-white shadow`}
                >
                  {platform.label.substring(0, 2)}
                </div>
                <div className="mt-2 text-sm font-semibold text-white">{platform.label}</div>
                <div className={`text-xs ${connected ? "text-emerald-200" : "text-slate-400"}`}>
                  {connected ? "Connected" : "Not connected"}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 space-y-2 text-sm text-slate-200">
          <div className="font-semibold text-white">How it works</div>
          <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300">
            <li>Click "Connect accounts" to launch the secure Ayrshare connection flow.</li>
            <li>Sign in to your social platforms and approve access.</li>
            <li>Return here and hit Refresh to see your connected status.</li>
          </ol>
          {loading && <div className="text-xs text-slate-400">Loading connections…</div>}
          {!loading && profiles.length > 0 && (
            <div className="text-xs text-emerald-200">{profiles.length} profile(s) detected.</div>
          )}
        </div>
      </div>
    </div>
  );
}

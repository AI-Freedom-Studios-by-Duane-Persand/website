"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import CampaignChatBot from "./components/CampaignChatBot";
import { CampaignList, Stepper } from "../../components/campaigns";
import SocialConnectionsCard from "../components/SocialConnectionsCard";
import EarlyAccessGate from "../../components/EarlyAccessGate";
import SubscriptionGate from "../../components/subscriptions/SubscriptionGate";
import { useAuth } from "../../hooks/useAuth";
import { useCampaigns } from "@/lib/hooks/useCampaigns";
import { getAuthHeaders } from "@/lib/utils/auth-headers";
import type { Campaign } from "@/lib/api/campaigns.api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";

function asArray<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.metaAds)) return payload.metaAds;
  if (Array.isArray(payload?.metaPosts)) return payload.metaPosts;
  return [];
}

type MetaPost = {
  id: string;
  content?: string;
  status?: string;
};

type MetaAd = {
  id: string;
  name?: string;
  objective?: string;
  status?: string;
  dailyBudget?: number;
  accountId?: string;
};

type TabKey = "chat" | "publishing" | "meta-posts" | "meta-ads" | "campaigns";

const GhostButton =
  "inline-flex items-center justify-center px-4 py-2.5 rounded-2xl text-sm font-semibold border border-white/10 bg-white/40 px-3 py-1 text-xs text-slate-600 hover:bg-white/60 transition";
const ButtonDanger =
  "inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/15 transition";
const InputBase =
  "w-full px-3 py-2.5 rounded-2xl bg-white/60 border border-white/10 text-slate-600 placeholder-slate-500 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/25";
const ButtonPrimary =
  "inline-flex items-center justify-center px-5 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb] shadow-lg hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed";

const StatPill = ({ label, value }: { label: string; value: any }) => (
  <div className="rounded-2xl border border-white/10 bg-white/20 px-4 py-3 shadow-lg backdrop-blur">
    <div className="text-xs text-slate-600">{label}</div>
    <div className="text-lg font-bold text-black">{value}</div>
  </div>
);

export default function CampaignsPage() {
  const { hasEarlyAccess } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [total, setTotal] = useState(0);
  const [step, setStep] = useState(1);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(
    null
  );

  const [metaPosts, setMetaPosts] = useState<MetaPost[]>([]);
  const [metaAds, setMetaAds] = useState<MetaAd[]>([]);
  const [metaContent, setMetaContent] = useState("");
  const [adName, setAdName] = useState("");
  const [adObjective, setAdObjective] = useState("AWARENESS");
  const [adBudget, setAdBudget] = useState(100);
  const [adStatus, setAdStatus] = useState("PAUSED");
  const [metaPageId, setMetaPageId] = useState("");
  const [metaAdAccountId, setMetaAdAccountId] = useState("");
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [savingConnection, setSavingConnection] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("chat");

  const loadConnections = useCallback(() => {
    if (typeof window === "undefined") return;
    const savedPageId = localStorage.getItem("metaPageId") || "";
    const savedAdAccountId = localStorage.getItem("metaAdAccountId") || "";
    if (savedPageId) setMetaPageId(savedPageId);
    if (savedAdAccountId) setMetaAdAccountId(savedAdAccountId);
  }, []);

  const saveConnections = useCallback((pageId: string, adAccountId: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("metaPageId", pageId);
    localStorage.setItem("metaAdAccountId", adAccountId);
    setMetaPageId(pageId);
    setMetaAdAccountId(adAccountId);
  }, []);

  const handleSaveConnection = useCallback(
    async (pageId: string, adAccountId: string) => {
      try {
        setSavingConnection(true);
        saveConnections(pageId, adAccountId);
        setShowConnectModal(false);
      } finally {
        setSavingConnection(false);
      }
    },
    [saveConnections]
  );

  const fetchUserId = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { ...getAuthHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        const id = data?.user?.id || data?.id || data?._id || data?.sub || "";
        if (id) {
          setUserId(id);
          localStorage.setItem("userId", id);
        }
      } else {
        const stored = localStorage.getItem("userId");
        if (stored) setUserId(stored);
      }
    } catch (err) {
      console.error("Failed to fetch user id", err);
      const stored = localStorage.getItem("userId");
      if (stored) setUserId(stored);
    }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/campaigns`, {
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      const data = await res.json();
      const list = asArray<Campaign>(data);
      setCampaigns(list);
      setTotal(list.length);
    } catch (err) {
      console.error("Error fetching campaigns", err);
      setError("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/subscriptions/subscription-status`, {
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) return;
      const data = await res.json();
      setIsSubscribed(
        Boolean(data?.isSubscribed ?? data?.active ?? data?.status === "active")
      );
    } catch (err) {
      console.error("Error checking subscription", err);
      setIsSubscribed(false);
    }
  }, []);

  const fetchMetaPosts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/meta-posts`, {
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) throw new Error("Failed to fetch meta posts");
      const data = await res.json();
      setMetaPosts(asArray<MetaPost>(data));
    } catch (err) {
      console.error("Error fetching meta posts", err);
    }
  }, []);

  const fetchMetaAds = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/meta-ads`, {
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) throw new Error("Failed to fetch meta ads");
      const data = await res.json();
      setMetaAds(asArray<MetaAd>(data));
    } catch (err) {
      console.error("Error fetching meta ads", err);
    }
  }, []);

  const publishMetaPost = useCallback(async () => {
    if (!metaPageId) {
      setShowConnectModal(true);
      return;
    }
    if (!metaContent.trim()) return;
    setPublishing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/meta-posts`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ content: metaContent, metaPageId }),
      });
      if (!res.ok) throw new Error("Failed to publish meta post");
      const created = await res.json();
      setMetaPosts((prev) => [created, ...prev]);
      setMetaContent("");
    } catch (err) {
      console.error("Error publishing meta post", err);
      setError("Failed to publish meta post");
    } finally {
      setPublishing(false);
    }
  }, [metaContent, metaPageId]);

  const publishMetaAd = useCallback(async () => {
    if (!metaAdAccountId) {
      setShowConnectModal(true);
      return;
    }
    if (!adName.trim()) return;
    setPublishing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/meta-ads/campaigns`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          name: adName,
          objective: adObjective,
          dailyBudget: adBudget,
          accountId: metaAdAccountId,
          status: adStatus,
        }),
      });
      if (!res.ok) throw new Error("Failed to publish meta ad");
      const created = await res.json();
      setMetaAds((prev) => [created, ...prev]);
      setAdName("");
      setAdObjective("AWARENESS");
      setAdBudget(100);
      setAdStatus("PAUSED");
    } catch (err) {
      console.error("Error publishing meta ad", err);
      setError("Failed to publish meta ad");
    } finally {
      setPublishing(false);
    }
  }, [adBudget, adName, adObjective, adStatus, metaAdAccountId]);

  const deleteMetaPost = useCallback(async (postId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/meta-posts/${postId}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) throw new Error("Failed to delete meta post");
      setMetaPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (err) {
      console.error("Error deleting meta post", err);
    }
  }, []);

  const deleteMetaAd = useCallback(async (adId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/meta-ads/${adId}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) throw new Error("Failed to delete meta ad");
      setMetaAds((prev) => prev.filter((ad) => ad.id !== adId));
    } catch (err) {
      console.error("Error deleting meta ad", err);
    }
  }, []);

  const deleteCampaign = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) throw new Error("Failed to delete campaign");
      setCampaigns((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error("Error deleting campaign", err);
      setError("Failed to delete campaign");
    }
  }, []);

  useEffect(() => {
    loadConnections();
    fetchUserId();
    fetchCampaigns();
    checkSubscription();
    fetchMetaPosts();
    fetchMetaAds();
  }, [
    loadConnections,
    fetchUserId,
    fetchCampaigns,
    checkSubscription,
    fetchMetaPosts,
    fetchMetaAds,
  ]);

  const progress = useMemo(() => (step / 6) * 100, [step]);

  const navTabs: { id: TabKey; label: string; hint?: string }[] = [
    { id: "chat", label: "Strategy Builder", hint: "Draft & iterate" },
    { id: "campaigns", label: "Campaigns", hint: "List & manage" },
    { id: "publishing", label: "Publishing", hint: "Meta post / ad" },
    { id: "meta-posts", label: "Meta Posts", hint: "History" },
    { id: "meta-ads", label: "Meta Ads", hint: "History" },
  ];

  return (
    <EarlyAccessGate hasAccess={hasEarlyAccess}>
      <SubscriptionGate>
    <main className="min-h-screen bg-gradient-to-r from-[#ef4444]/15 via-[#f97316]/12 to-[#2563eb]/15 px-4 py-6 text-white">
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white/80 border border-white/10 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-black">Connect Meta Accounts</h3>
            <p className="text-sm text-slate-600 mt-1">
              Add your Meta Page ID for posts and Ad Account ID for ads. Stored locally.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-slate-600">Meta Page ID</label>
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 text-slate-600 bg-white/60 px-3 py-2 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/25"
                  value={metaPageId}
                  onChange={(e) => setMetaPageId(e.target.value)}
                  placeholder="123456789"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600">Meta Ad Account ID</label>
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 text-slate-600 bg-white/60 px-3 py-2 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/25"
                  value={metaAdAccountId}
                  onChange={(e) => setMetaAdAccountId(e.target.value)}
                  placeholder="xxxxxxxx"
                />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button className={GhostButton} onClick={() => setShowConnectModal(false)}>
                Cancel
              </button>
              <button
                className={ButtonPrimary}
                onClick={() => handleSaveConnection(metaPageId, metaAdAccountId)}
                disabled={savingConnection || !metaPageId || !metaAdAccountId}
              >
                {savingConnection ? "Saving…" : "Save & Continue"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full">
        <header className="relative overflow-hidden rounded-3xl bg-white/5 px-5 py-4 md:px-6 md:py-6 shadow-2xl shrink-0 mb-6 mt-32 md:mt-24">
          <div className="absolute inset-0 bg-white/20 blur-3xl " />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#ef4444] via-[#f97316] to-[#2563eb] shadow-xl flex items-center justify-center font-extrabold">
                C
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl  text-black font-bold tracking-tight">
                  Campaigns & Publishing
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatPill label="Total" value={total} />
              <div
                className={["rounded-2xl border px-4 py-3 shadow-lg backdrop-blur", isSubscribed ? "border-emerald-500/20 bg-emerald-500/10" : "border-amber-500/20 bg-amber-500/10"].join(" ")}
              >
                <div className="text-xs text-slate-600">Subscription</div>
                <div className="text-lg font-bold text-slate-800">{isSubscribed ? "Active" : "Inactive"}</div>
              </div>
              <button type="button" onClick={fetchCampaigns} className={GhostButton}>
                Refresh
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 mb-6">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-[260px,1fr] gap-6 min-h-[calc(100vh-16rem)]">
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl h-fit lg:sticky lg:top-6 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Workflow</div>
                <div className="text-sm text-slate-800">Campaign flow</div>
              </div>
              <button  className={GhostButton} onClick={() => setShowConnectModal(true)}>
                Connect
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {navTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-between rounded-2xl px-3 py-2 text-sm font-semibold border transition ${
                    activeTab === tab.id
                      ? "border-white/20 bg-white/60 text-black"
                      : "border-white/5 bg-white/20 text-slate-600 hover:border-white/15"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="text-[11px] text-slate-400">{tab.hint}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 text-xs text-slate-400">
              Meta Page: {metaPageId || "Not connected"} • Ad Account: {metaAdAccountId || "Not connected"}
            </div>
          </aside>

          <div className="min-h-0">
            {activeTab === "chat" && (
              <div className="flex flex-col">
                {!isSubscribed && (
                  <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                    Some features may be restricted until you activate a plan.
                  </div>
                )}
                {editingCampaignId ? (
                  <CampaignChatBot
                    userId={userId}
                    editCampaignId={editingCampaignId}
                    onCampaignUpdated={() => {
                      fetchCampaigns();
                      setEditingCampaignId(null);
                    }}
                  />
                ) : (
                  <CampaignChatBot userId={userId} />
                )}
              </div>
            )}

            {activeTab === "publishing" && (
              <section className="rounded-3xl border border-white/10 bg-white/20 p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg  text-black font-bold">Publishing</h3>
                    <p className="text-xs text-slate-600">Post directly to Facebook and Instagram, or schedule Meta ads.</p>
                  </div>
                  <button className={GhostButton} onClick={() => setShowConnectModal(true)}>
                    Connect
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/30 p-3">
                    <div className="text-sm font-semibold text-black">Post to Facebook/Instagram</div>
                    <textarea
                      className="mt-2 w-full text-black rounded-xl border border-white/10 bg-white/60 px-3 py-2 text-sm outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/25"
                      rows={6}
                      placeholder="Caption for your post"
                      value={metaContent}
                      onChange={(e) => setMetaContent(e.target.value)}
                    />
                    <button
                      className={`${ButtonPrimary} mt-3 w-full`}
                      onClick={publishMetaPost}
                      disabled={!metaContent.trim() || publishing}
                    >
                      Publish Post
                    </button>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/30 p-3 space-y-2">
                    <div className="text-sm font-semibold text-black">Meta Ads</div>
                    <input
                      className={InputBase}
                      placeholder="Ad campaign name"
                      value={adName}
                      onChange={(e) => setAdName(e.target.value)}
                    />
                    <select
                      className={InputBase}
                      value={adObjective}
                      onChange={(e) => setAdObjective(e.target.value)}
                    >
                      <option value="AWARENESS">Awareness</option>
                      <option value="TRAFFIC">Traffic</option>
                      <option value="ENGAGEMENT">Engagement</option>
                      <option value="LEAD_GENERATION">Lead Generation</option>
                      <option value="SALES">Sales</option>
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className={InputBase}
                        type="number"
                        min={100}
                        value={adBudget}
                        onChange={(e) => setAdBudget(Number(e.target.value))}
                        placeholder="Daily budget"
                      />
                      <select
                        className={InputBase}
                        value={adStatus}
                        onChange={(e) => setAdStatus(e.target.value)}
                      >
                        <option value="PAUSED">Paused</option>
                        <option value="ACTIVE">Active</option>
                      </select>
                    </div>
                    <button
                      className={`${ButtonPrimary} w-full`}
                      onClick={publishMetaAd}
                      disabled={!adName.trim() || publishing}
                    >
                      Create / Publish Ad
                    </button>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "meta-posts" && (
              <section className="rounded-3xl border border-white/10 bg-white/20 p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-black">Meta Posts</h3>
                  <button className={GhostButton} onClick={fetchMetaPosts}>Refresh</button>
                </div>
                {!Array.isArray(metaPosts) || metaPosts.length === 0 ? (
                  <div className="text-sm text-slate-600">No posts yet.</div>
                ) : (
                  <ul className="space-y-2">
                    {metaPosts.map((post) => (
                      <li
                        key={post.id}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/40 p-4"
                      >
                        <div className="min-w-0">
                          <div className="text-sm text-slate-600 truncate">{post.content}</div>
                          <div className="mt-1 text-xs text-slate-400">Status: {post.status}</div>
                        </div>
                        <button onClick={() => deleteMetaPost(post.id)} className={ButtonDanger}>
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {activeTab === "meta-ads" && (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-black">Meta Ads</h3>
                  <button className={GhostButton} onClick={fetchMetaAds}>Refresh</button>
                </div>
                {!Array.isArray(metaAds) || metaAds.length === 0 ? (
                  <div className="text-sm text-slate-600">No ads yet.</div>
                ) : (
                  <ul className="space-y-2">
                    {metaAds.map((ad) => (
                      <li
                        key={ad.id}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="min-w-0">
                          <div className="text-sm text-slate-100 truncate">{ad.name}</div>
                          <div className="mt-1 text-xs text-slate-400">Status: {ad.status}</div>
                        </div>
                        <button onClick={() => deleteMetaAd(ad.id)} className={ButtonDanger}>
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {activeTab === "campaigns" && (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl flex flex-col max-h-[calc(100vh-15rem)] overflow-hidden">
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <div>
                    <h3 className="text-lg font-bold text-black">All Campaigns</h3>
                    <p className="text-xs text-slate-600 mt-1">Manage, edit, or delete campaigns</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => {
                      setEditingCampaignId(null);
                      setActiveTab("chat");
                    }} className={GhostButton}>
                      + New
                    </button>
                    <button type="button" onClick={fetchCampaigns} className={GhostButton}>
                      Refresh
                    </button>
                  </div>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-white/5 bg-white/5 p-3">
                  <CampaignList
                    campaigns={campaigns}
                    loading={loading}
                    error={error}
                    onEdit={(campaignId) => {
                      setEditingCampaignId(campaignId);
                      setActiveTab("chat");
                    }}
                    onDelete={deleteCampaign}
                    onRefresh={fetchCampaigns}
                  />
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
      </SubscriptionGate>
    </EarlyAccessGate>
  );
}

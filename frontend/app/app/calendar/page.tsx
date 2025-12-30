// frontend/app/app/calendar/page.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import EarlyAccessGate from "../../components/EarlyAccessGate";
import { useAuth } from "../../hooks/useAuth";

interface ScheduledPost {
  _id: string;
  content: string;
  assetUrl?: string;
  scheduledAt: string;
}

function isImage(url?: string) {
  if (!url) return false;
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url) || url.includes("image");
}
function isVideo(url?: string) {
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v|ogg)$/i.test(url) || url.includes("video");
}

export default function CalendarPage() {
  const { hasEarlyAccess } = useAuth();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [content, setContent] = useState("");
  const [assetUrl, setAssetUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const nowLocalDefault = useMemo(() => {
    // yyyy-MM-ddThh:mm for datetime-local
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  }, []);

  async function fetchPosts() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/scheduling");
      if (!res.ok) throw new Error("Failed to fetch scheduled posts");
      setPosts(await res.json());
    } catch (err: any) {
      setError(err.message || "Error loading posts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
    // Set a helpful default time if empty
    setScheduledAt((prev) => prev || nowLocalDefault);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/scheduling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, assetUrl, scheduledAt }),
      });
      if (!res.ok) throw new Error("Failed to schedule post");
      setContent("");
      setAssetUrl("");
      setScheduledAt(nowLocalDefault);
      fetchPosts();
    } catch (err: any) {
      setError(err.message || "Error scheduling post");
    }
  }

  const sortedPosts = useMemo(() => {
    return [...posts].sort(
      (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    );
  }, [posts]);

  return (
    <EarlyAccessGate hasAccess={hasEarlyAccess}>
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#020617] pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-white">
          <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Calendar
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                Schedule posts and manage your publishing queue.
              </p>
            </div>

            <button
              onClick={() => fetchPosts()}
              className="
                inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-semibold
                border border-white/10 bg-white/5 text-white
                hover:bg-white/10 transition
              "
              type="button"
            >
              Refresh
            </button>
          </div>
        </header>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3"
          >
            {error}
          </div>
        )}

        {/* Composer */}
        <section className="bg-white/95 rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-slate-900">
                  Schedule a Post
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add content, optional asset URL, and select a date/time.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb]" />
                Scheduler
              </div>
            </div>

            <form onSubmit={handleSchedule} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Post content
                </label>
                <textarea
                  className="
                    mt-1 w-full min-h-[110px] rounded-2xl border border-slate-200 bg-white
                    px-4 py-3 text-sm text-slate-900 outline-none
                    focus:ring-2 focus:ring-slate-300
                  "
                  placeholder="Write your post…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
                <div className="mt-1 text-xs text-slate-500">
                  Tip: Keep it concise. Use your creatives as asset links.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Asset URL (optional)
                  </label>
                  <input
                    className="
                      mt-1 w-full rounded-2xl border border-slate-200 bg-white
                      px-4 py-3 text-sm text-slate-900 outline-none
                      focus:ring-2 focus:ring-slate-300
                    "
                    type="text"
                    placeholder="https://…"
                    value={assetUrl}
                    onChange={(e) => setAssetUrl(e.target.value)}
                  />
                  {assetUrl ? (
                    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs font-semibold text-slate-700 mb-2">
                        Preview
                      </div>
                      {isVideo(assetUrl) ? (
                        <video
                          src={assetUrl}
                          className="w-full rounded-lg bg-slate-100"
                          controls
                        />
                      ) : isImage(assetUrl) ? (
                        <img
                          src={assetUrl}
                          alt="Asset preview"
                          className="w-full rounded-lg object-cover bg-slate-100"
                        />
                      ) : (
                        <a
                          href={assetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-slate-700 underline hover:text-slate-900 break-all"
                        >
                          Open asset URL
                        </a>
                      )}
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Scheduled time
                  </label>
                  <input
                    className="
                      mt-1 w-full rounded-2xl border border-slate-200 bg-white
                      px-4 py-3 text-sm text-slate-900 outline-none
                      focus:ring-2 focus:ring-slate-300
                    "
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    required
                  />

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="
                        inline-flex items-center justify-center px-5 py-3 rounded-2xl text-sm font-semibold
                        text-white bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb]
                        shadow-md hover:shadow-lg hover:opacity-95 transition
                        disabled:opacity-60 disabled:cursor-not-allowed
                      "
                    >
                      {loading ? "Scheduling…" : "Schedule Post"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setContent("");
                        setAssetUrl("");
                        setScheduledAt(nowLocalDefault);
                        setError("");
                      }}
                      className="
                        inline-flex items-center justify-center px-5 py-3 rounded-2xl text-sm font-semibold
                        border border-slate-200 bg-white text-slate-800
                        hover:bg-slate-50 transition
                      "
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </section>

        {/* Queue */}
        <section className="bg-white/95 rounded-2xl shadow-xl border border-slate-200">
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-slate-900">
                  Scheduled Queue
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Latest scheduled items appear first.
                </p>
              </div>

              <div className="text-xs text-slate-600 rounded-full border border-slate-200 bg-white px-3 py-1">
                Total: <span className="font-semibold">{posts.length}</span>
              </div>
            </div>

            {loading ? (
              <div className="mt-8 text-center text-slate-500 text-sm">Loading…</div>
            ) : sortedPosts.length === 0 ? (
              <div className="mt-8 text-center text-slate-500 text-sm">
                Nothing scheduled yet.
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {sortedPosts.map((post) => {
                  const when = new Date(post.scheduledAt);
                  const isPast = when.getTime() < Date.now();

                  return (
                    <div
                      key={post._id}
                      className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs text-slate-500">
                              Scheduled
                            </div>
                            <div className="font-semibold text-slate-900">
                              {when.toLocaleString()}
                            </div>
                          </div>

                          <span
                            className={[
                              "shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border",
                              isPast
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700",
                            ].join(" ")}
                          >
                            {isPast ? "Past time" : "Upcoming"}
                          </span>
                        </div>

                        <div className="mt-3 text-sm text-slate-800 whitespace-pre-wrap">
                          {post.content}
                        </div>

                        {post.assetUrl ? (
                          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-xs font-semibold text-slate-700">
                                Asset
                              </div>
                              <a
                                href={post.assetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-slate-700 underline hover:text-slate-900"
                              >
                                Open
                              </a>
                            </div>

                            <div className="mt-2">
                              {isVideo(post.assetUrl) ? (
                                <video
                                  src={post.assetUrl}
                                  className="w-full rounded-lg bg-slate-100"
                                  controls
                                />
                              ) : isImage(post.assetUrl) ? (
                                <img
                                  src={post.assetUrl}
                                  alt="Scheduled asset"
                                  className="w-full rounded-lg object-cover bg-slate-100"
                                />
                              ) : (
                                <div className="text-xs text-slate-600 break-all">
                                  {post.assetUrl}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
    </EarlyAccessGate>
  );
}

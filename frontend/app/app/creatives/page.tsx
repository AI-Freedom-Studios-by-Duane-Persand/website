"use client";
import React, { useEffect, useMemo, useState } from "react";
import EarlyAccessGate from "../../components/EarlyAccessGate";
import SubscriptionGate from "../../components/SubscriptionGate";
import { useAuth } from "../../hooks/useAuth";

type Creative = { 
  _id: string; 
  type: 'text' | 'image' | 'video'; 
  status: string; 
  copy?: { caption?: string }; 
  visual?: { imageUrl?: string; prompt?: string }; 
  assets?: { videoUrl?: string }; 
  script?: { hook?: string; body?: string | string[]; outro?: string }; 
  tenantId?: string;
  updatedAt: string;
};

function isImage(url: string | undefined) {
  if (!url) return false;
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url) || url.includes("image");
}
function isVideo(url: string | undefined) {
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v|ogg)$/i.test(url) || url.includes("video");
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token =
    typeof window !== "undefined" &&
    (localStorage.getItem("token") || localStorage.getItem("auth_token"));
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default function CreativesPage() {
  const { hasEarlyAccess } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [renderingMedia, setRenderingMedia] = useState<Set<string>>(new Set());

  const apiUrl = useMemo(
    () =>
      process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "",
    []
  );

  async function fetchCreatives() {
    try {
      const res = await fetch(`${apiUrl}/api/creatives`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch creatives");
      setCreatives(await res.json());
      setError("");
    } catch (err: any) {
      setError(err.message || "Error loading creatives");
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError("");
    setUrl("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${apiUrl}/storage/upload`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setUrl(data.url);
      fetchCreatives();
      setFile(null);
    } catch (err: any) {
      setError(err.message || "Upload error");
    } finally {
      setUploading(false);
    }
  }

  function startEdit(creative: Creative) {
    setEditingId(creative._id);
    setEditCaption(creative.copy?.caption || "");
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;

    setError("");
    try {
      const res = await fetch(`${apiUrl}/api/creatives/${editingId}/edit-caption`, {
        method: "PUT",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ caption: editCaption }),
      });

      if (!res.ok) throw new Error("Failed to update creative");
      setEditingId(null);
      setEditCaption("");
      fetchCreatives();
    } catch (err: any) {
      setError(err.message || "Error updating creative");
    }
  }

  async function handleRenderMedia(creativeId: string, type: 'image' | 'video') {
    setError("");
    setRenderingMedia(prev => {
      const next = new Set(prev);
      next.add(creativeId);
      return next;
    });

    try {
      // Provide higher-quality defaults per media type
      const qualityPayload = type === 'image'
        ? {
            model: 'flux-schnell',
            width: 1280,
            height: 720,
            negativePrompt: 'low quality, blurry, artifacts, watermark, distorted anatomy',
            numInferenceSteps: 32,
            guidanceScale: 8,
            scheduler: 'DPM++ 2M',
          }
        : {
            model: 'zeroscope',
            durationSeconds: 12,
            fps: 24,
            negativePrompt: 'blurry, artifacts, watermark, choppy motion, distorted faces',
            numInferenceSteps: 28,
            guidanceScale: 7,
          };

      const res = await fetch(`${apiUrl}/api/creatives/${creativeId}/render`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(qualityPayload),
      });

      if (!res.ok) throw new Error(`Failed to start ${type} generation`);
      const data = await res.json();
      
      // Poll for updates (simple approach - refresh after delay)
      setTimeout(() => {
        fetchCreatives();
        setRenderingMedia(prev => {
          const next = new Set(prev);
          next.delete(creativeId);
          return next;
        });
      }, type === 'image' ? 15000 : 60000); // 15s for images, 60s for videos
      
    } catch (err: any) {
      setError(err.message || `Error generating ${type}`);
      setRenderingMedia(prev => {
        const next = new Set(prev);
        next.delete(creativeId);
        return next;
      });
    }
  }

  useEffect(() => {
    fetchCreatives();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <EarlyAccessGate hasAccess={hasEarlyAccess}>
      <SubscriptionGate>
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#020617] pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-white">
          <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Creatives
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                Upload assets and manage names/descriptions.
              </p>
            </div>

            <button
              onClick={() => fetchCreatives()}
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

        {/* Upload Card */}
        <section className="bg-white/95 rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-slate-900">
                  Upload Creative Asset
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Images and videos are supported.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb]" />
                Cloud storage
              </div>
            </div>

            <form onSubmit={handleUpload} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
                <label className="group relative flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:shadow transition cursor-pointer">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">
                      Choose file
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {file ? file.name : "PNG, JPG, WEBP, SVG, MP4, WEBM, MOV…"}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-700 rounded-full px-3 py-1.5 bg-slate-100 group-hover:bg-slate-200 transition">
                    Browse
                  </div>

                  <input
                    className="sr-only"
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="
                    inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold
                    text-white bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb]
                    shadow-md hover:shadow-lg hover:opacity-95 transition
                    disabled:opacity-60 disabled:cursor-not-allowed
                  "
                >
                  {uploading ? "Uploading…" : "Upload"}
                </button>
              </div>
            </form>

            {url && (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">
                  Uploaded successfully
                </div>
                <div className="mt-2 text-xs text-slate-600 break-all">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-slate-900"
                  >
                    {url}
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Creatives Grid */}
        <section className="bg-white/95 rounded-2xl shadow-xl border border-slate-200">
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-slate-900">
                  Your Creatives
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Generated and uploaded creatives from your campaigns.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchCreatives()}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition"
                >
                  Refresh
                </button>
                <div className="text-xs text-slate-600 rounded-full border border-slate-200 bg-white px-3 py-1">
                  Total: <span className="font-semibold">{creatives.length}</span>
                </div>
              </div>
            </div>

            {creatives.length === 0 ? (
              <div className="mt-8 text-center text-slate-500 text-sm">
                No creatives yet. Generate content in campaigns or upload files to get started.
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {creatives.map((creative) => {
                  const active = editingId === creative._id;
                  const previewUrl = creative.type === 'text' ? null : (creative.type === 'image' ? creative.visual?.imageUrl : creative.assets?.videoUrl);
                  const imagePrompt = creative.type === 'image' ? creative.visual?.prompt : null;
                  const videoScript = creative.type === 'video' ? creative.script : null;

                  return (
                    <div
                      key={creative._id}
                      className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition"
                    >
                      {/* Type Badge + Preview */}
                      <div className="aspect-[16/9] bg-slate-100 flex items-center justify-center overflow-hidden relative">
                        <div className="absolute top-2 left-2 z-10 text-xs font-semibold px-2 py-1 rounded-lg bg-black/70 text-white">
                          {creative.type === 'text' ? '📝 Text' : creative.type === 'image' ? '🖼️ Image' : '🎥 Video'}
                        </div>
                        {previewUrl && isVideo(previewUrl) ? (
                          <video
                            src={previewUrl}
                            className="h-full w-full object-cover"
                            controls
                            preload="metadata"
                          />
                        ) : previewUrl && isImage(previewUrl) ? (
                          <img
                            src={previewUrl}
                            alt="Creative preview"
                            className="h-full w-full object-cover"
                          />
                        ) : creative.type === 'image' && imagePrompt ? (
                          <div className="text-xs text-slate-600 px-4 text-center space-y-2">
                            <div className="text-4xl">🎨</div>
                            <div className="font-semibold text-slate-700">Image Concept</div>
                            <div className="text-[11px] line-clamp-3">{imagePrompt}</div>
                            <div className="text-[10px] text-slate-400 italic">Media rendering pending</div>
                          </div>
                        ) : creative.type === 'video' && videoScript ? (
                          <div className="text-xs text-slate-600 px-4 text-center space-y-2">
                            <div className="text-4xl">🎬</div>
                            <div className="font-semibold text-slate-700">Video Script</div>
                            <div className="text-[11px] line-clamp-3">
                              {typeof videoScript.body === 'string' 
                                ? videoScript.body 
                                : Array.isArray(videoScript.body) 
                                  ? videoScript.body.join(' • ') 
                                  : 'Script ready'}
                            </div>
                            <div className="text-[10px] text-slate-400 italic">Media rendering pending</div>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500 px-4 text-center">
                            {creative.type === 'text' ? '📝 Text Creative' : 'Preview not available'}
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        {active ? (
                          <form onSubmit={handleEdit} className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700">
                                Caption
                              </label>
                              <textarea
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                                value={editCaption}
                                onChange={(e) => setEditCaption(e.target.value)}
                                rows={3}
                              />
                            </div>

                            <div className="flex gap-2 pt-1">
                              <button
                                type="submit"
                                className="
                                  flex-1 inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold
                                  text-white bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb]
                                  shadow-md hover:shadow-lg hover:opacity-95 transition
                                "
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="
                                  flex-1 inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold
                                  border border-slate-200 bg-white text-slate-800
                                  hover:bg-slate-50 transition
                                "
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900">
                                  {creative.copy?.caption || `${creative.type === 'text' ? 'Text' : creative.type === 'image' ? 'Image' : 'Video'} Creative`}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                  Status: <span className="font-semibold">{creative.status}</span>
                                </div>
                                <div className="mt-2 text-[10px] text-slate-400">
                                  {new Date(creative.updatedAt).toLocaleDateString()}
                                </div>
                              </div>

                              <button
                                onClick={() => startEdit(creative)}
                                className="
                                  shrink-0 inline-flex items-center px-3 py-2 rounded-full text-xs font-semibold
                                  border border-slate-200 bg-white text-slate-800
                                  hover:bg-slate-50 transition
                                "
                              >
                                Edit
                              </button>
                            </div>

                            {/* Show image prompt if no URL */}
                            {creative.type === 'image' && !previewUrl && imagePrompt && (
                              <div className="mt-3 space-y-2">
                                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                  <div className="text-[10px] font-semibold text-slate-600 uppercase mb-1">Image Prompt</div>
                                  <div className="text-xs text-slate-700">{imagePrompt}</div>
                                </div>
                                <button
                                  onClick={() => handleRenderMedia(creative._id, 'image')}
                                  disabled={renderingMedia.has(creative._id)}
                                  className="
                                    w-full inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold
                                    bg-gradient-to-r from-purple-500 to-blue-500 text-white
                                    hover:opacity-90 transition
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                  "
                                >
                                  {renderingMedia.has(creative._id) ? '🎨 Generating Image...' : '🎨 Generate Image'}
                                </button>
                              </div>
                            )}

                            {/* Show video script if no URL */}
                            {creative.type === 'video' && !previewUrl && videoScript && (
                              <div className="mt-3 space-y-2">
                                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                  <div className="text-[10px] font-semibold text-slate-600 uppercase mb-1">Video Script</div>
                                  <div className="text-xs text-slate-700 space-y-1">
                                    {videoScript.hook && <div><strong>Hook:</strong> {videoScript.hook}</div>}
                                    {videoScript.body && (
                                      <div>
                                        <strong>Body:</strong> {
                                          typeof videoScript.body === 'string' 
                                            ? videoScript.body 
                                            : Array.isArray(videoScript.body) 
                                              ? videoScript.body.map((line, i) => <div key={i}>• {line}</div>)
                                              : 'Script ready'
                                        }
                                      </div>
                                    )}
                                    {videoScript.outro && <div><strong>Outro:</strong> {videoScript.outro}</div>}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRenderMedia(creative._id, 'video')}
                                  disabled={renderingMedia.has(creative._id)}
                                  className="
                                    w-full inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold
                                    bg-gradient-to-r from-red-500 to-purple-500 text-white
                                    hover:opacity-90 transition
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                  "
                                >
                                  {renderingMedia.has(creative._id) ? '🎬 Generating Video...' : '🎬 Generate Video'}
                                </button>
                              </div>
                            )}

                            {previewUrl && (
                              <div className="mt-3">
                                <a
                                  href={previewUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-semibold text-slate-700 underline hover:text-slate-900 break-all"
                                >
                                  View {creative.type === 'image' ? 'image' : 'video'}
                                </a>
                              </div>
                            )}
                          </>
                        )}
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
      </SubscriptionGate>
    </EarlyAccessGate>
  );
}

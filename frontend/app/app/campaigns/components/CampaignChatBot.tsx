"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { getAuthHeaders } from "@/lib/utils/auth-headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";

type Message = { sender: "user" | "system"; message: string; step?: string };
type Props = {
  userId: string;
  editCampaignId?: string | null;
  onCampaignUpdated?: () => void;
};

export default function CampaignChatBot({ userId, editCampaignId = null, onCampaignUpdated }: Props) {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [consideration, setConsideration] = useState("");
  const [aiRecommendation, setAIRecommendation] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [stepKey, setStepKey] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [extractedParams, setExtractedParams] = useState<Record<string, unknown>>({});
  const [insights, setInsights] = useState<any[]>([]);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [creatives, setCreatives] = useState<any[]>([]);
  const [lastUploads, setLastUploads] = useState<{ url: string; filename: string }[]>([]);
  const [regenPromptMap, setRegenPromptMap] = useState<Record<string, string>>({});
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [editingCreativeId, setEditingCreativeId] = useState<string | null>(null);
  const [inlineEditText, setInlineEditText] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior });
    }
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior });
  };

  // Normalize and dedupe insights so UI stays readable and avoids rendering objects
  const normalizedInsights = useMemo(() => {
    const map = new Map<string, { title: string; detail?: string; raw: unknown }>();
    insights.forEach((item) => {
      if (typeof item === "string") {
        const key = item.trim();
        if (!map.has(key)) map.set(key, { title: item, raw: item });
        return;
      }
      const anyItem: any = item as any;
      const title = anyItem?.title || JSON.stringify(anyItem);
      const detail = anyItem?.detail || anyItem?.description || "";
      const key = `${title}|${detail}`;
      if (!map.has(key)) map.set(key, { title, detail, raw: item });
    });
    return Array.from(map.values());
  }, [insights]);

  const visibleInsights = useMemo(() => {
    if (showAllInsights) return normalizedInsights;
    return normalizedInsights.slice(0, 6);
  }, [normalizedInsights, showAllInsights]);

  const filteredCreatives = useMemo(() => {
    return creatives.filter((c) => {
      const platformMatch = !platformFilter || (c.metadata?.platforms && c.metadata.platforms.includes(platformFilter));
      const statusMatch = !statusFilter || c.status === statusFilter;
      return platformMatch && statusMatch;
    });
  }, [creatives, platformFilter, statusFilter]);

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages]);

  // Auto-trigger asset generation when reaching assetGeneration step
  useEffect(() => {
    if (stepKey === 'assetGeneration' && sessionId && creatives.length === 0) {
      // Automatically prompt user to start generating assets
      setMessages((prev) => [
        ...prev,
        { 
          sender: "system", 
          message: "🎨 Strategy complete! Now let's generate your campaign assets. Choose what to generate below, or I can generate everything automatically.",
          step: stepKey 
        }
      ]);
    }
  }, [stepKey, sessionId]);

  const loadMessageHistory = async (sessionId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-chat/messages/${sessionId}`, {
        method: "GET",
        headers: { ...getAuthHeaders() },
      });
      if (res.ok) {
        const history = await res.json();
        const loadedMessages = history.map((msg: any) => ({
          sender: msg.sender,
          message: msg.message,
          step: msg.step,
        }));
        setMessages(loadedMessages);
        setTimeout(() => scrollToBottom("auto"), 0);
        return loadedMessages; // Return the loaded messages
      }
      return []; // Return empty if not ok
    } catch (err) {
      console.error('Failed to load message history', err);
      return []; // Return empty on error
    }
  };

  const loadCreatives = async (sessionId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-chat/creatives/${sessionId}`, {
        method: 'GET',
        headers: { ...getAuthHeaders() },
      });
      if (res.ok) {
        const list = await res.json();
        setCreatives(list || []);
      }
    } catch (err) {
      console.error('Failed to load creatives', err);
    }
  };

  const startSession = async () => {
    setLoading(true);
    setError("");
    try {
      const campaignId = editCampaignId || 'new';
      const res = await fetch(`${API_BASE_URL}/api/campaign-chat/start/${campaignId}`, {
        method: "POST",
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) {
        const text = await res.text();
        console.error('startSession failed', res.status, text);
        throw new Error(`startSession failed (${res.status})`);
      }
      const data = await res.json();
      // NEW: Backend returns { sessionId, firstPrompt, firstConsideration, firstStepKey }
      const newSessionId = data?.sessionId || data?._id || data?.id;
      if (!newSessionId) {
        console.error('startSession missing session id payload', data);
        throw new Error('Session id missing from startSession response');
      }
      setSessionId(newSessionId);
      setDone(false);
      setStepKey(data?.firstStepKey || "");
      
      // Load existing message history if resuming
      let loadedMessages: Message[] = [];
      if (editCampaignId && editCampaignId !== 'new') {
        loadedMessages = await loadMessageHistory(newSessionId);
      }
      
      // Only add first prompt if we're starting a new campaign or no messages were loaded
      if (loadedMessages.length === 0) {
        if (data.firstPrompt) {
          setPrompt(data.firstPrompt);
          setConsideration(data.firstConsideration || '');
          setMessages((prev) => [...prev, { sender: "system", message: data.firstPrompt }]);
        } else {
          // Fallback: fetch first prompt if not included (backward compatibility)
          const stepRes = await fetch(`${API_BASE_URL}/api/campaign-chat/message/${newSessionId}`, {
            method: "POST",
            headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ message: "" }),
          });
          if (!stepRes.ok) {
            const text = await stepRes.text();
            console.error('initial prompt fetch failed', stepRes.status, text);
            throw new Error(`Initial prompt fetch failed (${stepRes.status})`);
          }
          const stepData = await stepRes.json();
          setPrompt(stepData.prompt);
          setConsideration(stepData.consideration);
          setMessages((prev) => [...prev, { sender: "system", message: stepData.prompt }]);
        }
      } else {
        // If messages were loaded, set the current prompt from backend data
        if (data.firstPrompt) {
          setPrompt(data.firstPrompt);
          setConsideration(data.firstConsideration || '');
        }
      }
      
      if (data.campaignId) {
        setCampaignId(data.campaignId);
        await loadCreatives(newSessionId);
      }
      
      // Extract existing parameters if available
      if (data.extracted) {
        setExtractedParams(data.extracted);
      }
    } catch (err) {
      setError("Failed to start campaign chat session.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionId) startSession();
    // eslint-disable-next-line
  }, []);

  const sendMessage = async (action: "send" | "skip" | "recommend" = "send") => {
    if (loading || done) return;

    if (!sessionId) {
      setError("Session not initialized. Please try restarting the chat.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let body: any = { message: input };

      if (action === "skip") body = { skip: true };
      if (action === "recommend") body = { recommend: true };

      const res = await fetch(`${API_BASE_URL}/api/campaign-chat/message/${sessionId}`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("sendMessage failed", res.status, text);
        throw new Error(`sendMessage failed (${res.status})`);
      }

      const data = await res.json();
      if (data?.campaignId) {
        setCampaignId(data.campaignId);
        await loadCreatives(sessionId);
      }

      // add user's message to UI (only when actually sending text)
      if (action === "send" && input) {
        setMessages((prev) => [...prev, { sender: "user", message: input }]);
        requestAnimationFrame(() => scrollToBottom("smooth"));
      }

      // handle payload fields
      if (data?.error) setError(data.error);

      if (data?.aiRecommendation) setAIRecommendation(data.aiRecommendation);
      else setAIRecommendation("");

      if (data?.stepKey) setStepKey(data.stepKey);

      if (data?.extracted) {
        setExtractedParams((prev) => ({ ...prev, ...data.extracted }));
      }

      if (data?.insights) {
        setInsights((prev) => {
          const combined = [...(prev || []), ...data.insights];
          const unique = Array.from(new Map(combined.map((ins: any) => {
            const key = typeof ins === 'string' ? ins : `${ins?.title || JSON.stringify(ins)}|${ins?.detail || ins?.description || ''}`;
            return [key, ins];
          })).values());
          return unique as any;
        });
      }

      if (data?.prompt) {
        setPrompt(data.prompt);
        setConsideration(data.consideration || "");
        setMessages((prev) => [
          ...prev,
          { sender: "system", message: data.prompt, step: data.stepKey },
        ]);
      }

      if (data?.done) {
        setDone(true);
        setPrompt("");
        setConsideration("");
        setMessages((prev) => [
          ...prev,
          { sender: "system", message: "Campaign setup complete!" },
        ]);
        if (onCampaignUpdated) {
          onCampaignUpdated()
        } ;
      }

      setInput("");
    } catch (err) {
      console.error(err);
      setError("Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!sessionId || !files?.length) return;
    setUploadingFiles(true);
    try {
      const formData = new FormData();
      const fileNames: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        formData.append('files', file);
        fileNames.push(file.name);
      }
      
      // Show user message with uploaded files
      const fileListMsg = fileNames.length === 1 
        ? `📎 Uploaded: ${fileNames[0]}`
        : `📎 Uploaded ${fileNames.length} files: ${fileNames.join(', ')}`;
      setMessages(prev => [...prev, { sender: 'user', message: fileListMsg }]);
      
      const res = await fetch(`${API_BASE_URL}/api/campaign-chat/upload/${sessionId}`, {
        method: 'POST',
        headers: { ...getAuthHeaders() },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      if (Array.isArray(data?.uploaded)) {
        setLastUploads(data.uploaded);
      }
      
      // Load creatives to show newly uploaded assets
      await loadCreatives(sessionId);
      
      // Show system confirmation
      const uploaded = data.uploaded || [];
      const successMsg = uploaded.length === 1
        ? `✓ Asset uploaded successfully and added to your campaign library`
        : `✓ ${uploaded.length} assets uploaded successfully and added to your campaign library`;
      setMessages(prev => [...prev, { sender: 'system', message: successMsg }]);
    } catch (err) {
      setError('File upload failed');
      setMessages(prev => [...prev, { sender: 'system', message: '✗ File upload failed. Please try again.' }]);
    } finally {
      setUploadingFiles(false);
    }
  };

  const generateViaChat = async (kind: 'text' | 'image' | 'video' | 'all') => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaign-chat/generate/${sessionId}`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, model: selectedModel }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      await loadCreatives(sessionId);
      setMessages(prev => [...prev, { sender: 'system', message: `✓ Generated ${Array.isArray(data?.generated) ? data.generated.length : 0} creative(s) with ${selectedModel}.` }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'system', message: '✗ Generation failed. Try again.' }]);
    }
  };

  const linkUploadToCreative = async (creativeId: string, type: 'image' | 'video') => {
    const last = lastUploads?.[lastUploads.length - 1];
    if (!last) {
      setMessages(prev => [...prev, { sender: 'system', message: 'No uploaded asset to link. Upload first.' }]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/creatives/${creativeId}/assets`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: last.url, type }),
      });
      if (!res.ok) throw new Error('Link failed');
      await loadCreatives(sessionId);
      setMessages(prev => [...prev, { sender: 'system', message: '✓ Asset linked to creative.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'system', message: '✗ Failed to link asset.' }]);
    }
  };

  const regenerateCreative = async (creativeId: string, type: 'text' | 'image' | 'video') => {
    const prompt = regenPromptMap[creativeId] || '';
    const scope = regenPromptMap[`scope:${creativeId}`] || (type === 'text' ? 'caption' : type === 'image' ? 'prompt' : 'script');
    if (!prompt) {
      setMessages(prev => [...prev, { sender: 'system', message: 'Enter a prompt to regenerate.' }]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/creatives/${creativeId}/regenerate`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel, prompt, scope }),
      });
      if (!res.ok) throw new Error('Regenerate failed');
      await loadCreatives(sessionId);
      setMessages(prev => [...prev, { sender: 'system', message: `✓ ${type} creative regenerated (${scope}) with ${selectedModel}.` }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'system', message: '✗ Regeneration failed.' }]);
    }
  };

  const editCaption = async (creativeId: string) => {
    const caption = inlineEditText;
    if (!caption) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/creatives/${creativeId}/edit-caption`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption }),
      });
      if (!res.ok) throw new Error('Edit failed');
      await loadCreatives(sessionId);
      setEditingCreativeId(null);
      setInlineEditText('');
      setMessages(prev => [...prev, { sender: 'system', message: '✓ Caption updated.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'system', message: '✗ Caption edit failed.' }]);
    }
  };

  const editHashtags = async (creativeId: string) => {
    const hashtags = inlineEditText;
    if (!hashtags) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/creatives/${creativeId}/edit-hashtags`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ hashtags }),
      });
      if (!res.ok) throw new Error('Edit failed');
      await loadCreatives(sessionId);
      setEditingCreativeId(null);
      setInlineEditText('');
      setMessages(prev => [...prev, { sender: 'system', message: '✓ Hashtags updated.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'system', message: '✗ Hashtags edit failed.' }]);
    }
  };

  const editPrompt = async (creativeId: string) => {
    const prompt = inlineEditText;
    if (!prompt) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/creatives/${creativeId}/edit-prompt`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error('Edit failed');
      await loadCreatives(sessionId);
      setEditingCreativeId(null);
      setInlineEditText('');
      setMessages(prev => [...prev, { sender: 'system', message: '✓ Image prompt updated.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'system', message: '✗ Prompt edit failed.' }]);
    }
  };

  const handleWebsiteSubmit = async () => {
    if (!sessionId || !websiteUrl) return;
    setLoading(true);
    try {
      // Show user message with website link
      setMessages(prev => [...prev, { sender: 'user', message: `🌐 Website for analysis: ${websiteUrl}` }]);
      
      const res = await fetch(`${API_BASE_URL}/api/campaign-chat/message/${sessionId}`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl }),
      });
      if (!res.ok) throw new Error('Website submission failed');
      const data = await res.json();
      
      // Show system response with insights
      if (data.insights && data.insights.length > 0) {
        const insightMsg = `✓ Website analyzed successfully. Extracted ${data.insights.length} insights to enhance your campaign.`;
        setMessages(prev => [...prev, { sender: 'system', message: insightMsg }]);
        setInsights(data.insights);
      }
      
      if (data.extracted) {
        setExtractedParams((prev) => ({ ...prev, ...data.extracted }));
      }
      
      if (data.prompt) {
        setPrompt(data.prompt);
        setConsideration(data.consideration || '');
        setMessages(prev => [...prev, { sender: 'system', message: data.prompt }]);
      }
      setWebsiteUrl('');
    } catch (err) {
      setError('Website analysis failed');
      setMessages(prev => [...prev, { sender: 'system', message: '✗ Website analysis failed. Please check the URL and try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-gradient-to-b from-white/10 via-white/5 to-transparent border border-white/10 rounded-3xl shadow-2xl flex flex-col">
      {/* Header - Fixed at top */}
      <div className="shrink-0 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-200">
              Campaign Copilot
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h3 className="mt-2 text-lg font-semibold text-white">Strategy Builder (15 steps)</h3>
            <p className="text-xs text-slate-400">Comprehensive input collection for 95% campaign success rate.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full px-3 py-1 text-xs font-semibold bg-white/10 border border-white/10 text-slate-200">
              {stepKey ? `Step: ${stepKey}` : done ? "✓ Complete" : "Starting..."}
            </span>
            <button
              type="button"
              onClick={startSession}
              className="text-xs font-semibold px-3 py-2 rounded-2xl border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 disabled:opacity-60"
              disabled={loading}
            >
              Restart
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container - Scrollable only this section */}
      <div
        ref={chatContainerRef}
        className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-2 scrollbar-thin scrollbar-thumb-[#f97316]/70 hover:scrollbar-thumb-[#f97316]/90 scrollbar-track-slate-900/60 scrollbar-corner-transparent scrollbar-thumb-rounded-full"
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`px-4 py-3 rounded-2xl max-w-[82%] shadow ${msg.sender === "user" ? "bg-gradient-to-r from-[#f97316] to-[#2563eb] text-white" : "bg-white/10 text-slate-100 border border-white/5"}`}>
              <div className="text-[11px] uppercase tracking-wide font-semibold opacity-80 mb-1">
                {msg.sender === "user" ? "You" : "Copilot"}
              </div>
              <div className="leading-relaxed text-sm whitespace-pre-wrap">{msg.message}</div>
              {msg.step && (
                <div className="mt-1 text-[11px] text-amber-200">Step: {msg.step}</div>
              )}
            </div>
          </div>
        ))}
        {prompt && (
          <div className="flex justify-start">
            <div className="w-full rounded-2xl bg-white/10 border border-white/10 p-4 text-slate-100 shadow-inner">
              <div className="text-[11px] uppercase tracking-wide font-semibold text-amber-200">Current Prompt</div>
              <div className="mt-1 text-sm leading-relaxed">{prompt}</div>
              {consideration && (
                <div className="mt-2 text-xs text-amber-100/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 inline-flex">
                  {consideration}
                </div>
              )}
              {aiRecommendation && (
                <div className="mt-3 text-xs text-emerald-100 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                  AI Suggestion: {aiRecommendation}
                </div>
              )}
              {Object.keys(extractedParams).length > 0 && (
                <div className="mt-3 text-xs text-blue-100 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2">
                  <div className="font-semibold mb-1">Extracted from conversation:</div>
                  {Object.entries(extractedParams).map(([k, v]) => (
                    <div key={k} className="ml-2">• {k}: {typeof v === 'string' ? v : JSON.stringify(v)}</div>
                  ))}
                </div>
              )}
              {normalizedInsights.length > 0 && (
                <div className="mt-3 text-xs text-purple-100 bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold">Insights (deduped)</div>
                    {normalizedInsights.length > 6 && (
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-purple-50/80 hover:text-white underline"
                        onClick={() => setShowAllInsights(!showAllInsights)}
                      >
                        {showAllInsights ? "Hide" : "View all"} ({normalizedInsights.length})
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {visibleInsights.map((ins, idx) => (
                      <div
                        key={`${ins.title}-${idx}`}
                        className="flex items-start gap-2 rounded-2xl bg-white/10 border border-white/15 px-3 py-2 shadow-sm"
                      >
                        <span className="mt-[2px] h-2 w-2 rounded-full bg-purple-300/80" />
                        <div className="leading-snug">
                          <div className="font-semibold text-white">{ins.title}</div>
                          {ins.detail ? (
                            <div className="text-[11px] text-purple-50/80">{ins.detail}</div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>

                  {!showAllInsights && normalizedInsights.length > 6 && (
                    <div className="text-[10px] text-purple-50/60">+ {normalizedInsights.length - 6} more insights stored</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {error && (
          <div className="mb-2 flex justify-start">
            <div className="px-4 py-2 rounded-2xl bg-red-500/20 text-red-200 max-w-[80%]">
              {error}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Asset Generation Section - Fixed, not scrollable with messages */}
      {stepKey === 'assetGeneration' && (
        <div className="shrink-0 border-t border-white/10 bg-gradient-to-b from-emerald-500/10 via-white/5 to-transparent px-6 py-4 border-l-4 border-l-emerald-500/50">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <span className="text-lg">🎨</span>
                  Asset Generation
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Generate AI-powered content for your campaign</p>
              </div>
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-white/10 text-slate-100 text-xs"
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <button 
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold border border-emerald-400/20 shadow-lg hover:shadow-emerald-500/25 transition-all" 
                onClick={() => generateViaChat('all')}
              >
                ✨ Auto-Generate All Assets
              </button>
              <div className="h-4 w-px bg-white/10"></div>
              <button className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-200 border border-emerald-500/20 text-sm hover:bg-emerald-500/20 transition" onClick={() => generateViaChat('text')}>📝 Captions</button>
              <button className="px-3 py-2 rounded-xl bg-blue-500/10 text-blue-200 border border-blue-500/20 text-sm hover:bg-blue-500/20 transition" onClick={() => generateViaChat('image')}>🖼️ Images</button>
              <button className="px-3 py-2 rounded-xl bg-purple-500/10 text-purple-200 border border-purple-500/20 text-sm hover:bg-purple-500/20 transition" onClick={() => generateViaChat('video')}>🎬 Videos</button>
            </div>
            <div className="max-h-[150px] overflow-y-auto rounded-2xl bg-white/5 border border-white/10 p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] uppercase tracking-wide font-semibold text-slate-300">Creatives {filteredCreatives.length > 0 && `(${filteredCreatives.length})`}</div>
                <div className="flex items-center gap-2 text-[10px]">
                  <select 
                    value={platformFilter || ''} 
                    onChange={(e) => setPlatformFilter(e.target.value || null)}
                    className="px-2 py-1 rounded-lg bg-slate-950/60 border border-white/10 text-slate-100"
                  >
                    <option value="">All Platforms</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="facebook">Facebook</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter</option>
                  </select>
                  <select 
                    value={statusFilter || ''} 
                    onChange={(e) => setStatusFilter(e.target.value || null)}
                    className="px-2 py-1 rounded-lg bg-slate-950/60 border border-white/10 text-slate-100"
                  >
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="needsReview">Needs Review</option>
                    <option value="approved">Approved</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
              {creatives.length === 0 ? (
                <div className="text-xs text-slate-400">No creatives yet. Generate content or upload and link assets.</div>
              ) : filteredCreatives.length === 0 ? (
                <div className="text-xs text-slate-400">No creatives match the selected filters.</div>
              ) : (
                <div className="space-y-2 text-xs">
                  {filteredCreatives.map((c) => (
                    <div key={c._id} className="rounded-xl bg-white/10 border border-white/10 p-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-slate-300">{c.type.toUpperCase()} • {c.status}</div>
                        <div className="text-[10px] text-slate-400">{new Date(c.updatedAt).toLocaleString()}</div>
                      </div>
                      {c.type === 'text' && (
                        <div className="text-slate-100">{c.copy?.caption || '(no caption)'}</div>
                      )}
                      {c.type === 'image' && (
                        <div className="text-slate-100">Prompt: {c.visual?.prompt || '(no prompt)'}</div>
                      )}
                      {c.type === 'video' && (
                        <div className="text-slate-100">{c.script?.hook || ''}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input Form - Fixed at bottom */}
      <div className="shrink-0 border-t border-white/10 bg-gradient-to-t from-slate-950/40 to-transparent px-6 py-3">
        {!done && (
          <div className="space-y-2">
            <form
              onSubmit={e => {
                e.preventDefault();
                if (sessionId) sendMessage();
              }}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-3 rounded-2xl bg-slate-950/60 border border-white/10 text-slate-100 placeholder-slate-500 outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/25"
                  placeholder="Type your answer..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={loading || !sessionId}
                  required={!aiRecommendation}
                />
                <button
                  type="submit"
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb] text-white font-semibold disabled:opacity-50"
                  disabled={loading || !input || !sessionId}
                >
                  Send
                </button>
              </div>
            </form>
            <div className="flex gap-2 items-center text-xs">
              <input
                type="text"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-slate-100 placeholder-slate-500 outline-none"
                placeholder="Website URL for insights"
                value={websiteUrl}
                onChange={e => setWebsiteUrl(e.target.value)}
                disabled={loading || !sessionId}
              />
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-purple-500/10 text-purple-200 font-semibold border border-purple-500/20 disabled:opacity-50"
                onClick={handleWebsiteSubmit}
                disabled={loading || !websiteUrl || !sessionId}
              >
                Analyze
              </button>
            </div>
            <div className="flex gap-2 text-sm flex-wrap">
              <button
                type="button"
                className="px-4 py-2 rounded-2xl bg-white/10 text-slate-200 font-semibold border border-white/10 disabled:opacity-50"
                onClick={() => sessionId && sendMessage("skip")}
                disabled={loading || !sessionId}
              >
                Skip
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-2xl bg-emerald-500/10 text-emerald-200 font-semibold border border-emerald-500/20 disabled:opacity-50"
                onClick={() => sessionId && sendMessage("recommend")}
                disabled={loading || !sessionId}
              >
                Recommend
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
                accept="image/*,video/*,.pdf,.doc,.docx"
              />
              <button
                type="button"
                className="px-4 py-2 rounded-2xl bg-blue-500/10 text-blue-200 font-semibold border border-blue-500/20 disabled:opacity-50"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFiles || !sessionId}
              >
                {uploadingFiles ? 'Uploading...' : '📎 Upload'}
              </button>
              <div className="flex-1 text-right text-xs text-slate-400 flex items-center justify-end gap-2">
                {loading && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />} {loading ? "Thinking..." : ""}
              </div>
            </div>
          </div>
        )}
        {done && (
          <div className="text-center text-emerald-300 font-bold">
            Campaign setup complete! You can start another session anytime.
          </div>
        )}
      </div>
    </div>
  );
}

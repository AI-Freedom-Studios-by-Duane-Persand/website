"use client";

import React, { useState, useRef, useMemo } from "react";
import { getAuthHeaders } from "@/lib/utils/auth-headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";

interface VideoModel {
  key: string;
  name: string;
  description: string;
  durationRange: { min: number; max: number };
  supportsReferenceImages: boolean;
  quality: "highest" | "high" | "good";
}

interface GenerationResult {
  videoUrl: string;
  videoPath: string;
  prompt: string;
  refinedPrompt?: string;
  model: string;
  duration: number;
  referenceImages: Array<{ url: string; uploadedAt: string }>;
  metadata: {
    generatedAt: string;
    provider: string;
    resolution?: string;
  };
}

type Props = {
  campaignId?: string;
  onVideoGenerated?: (result: GenerationResult) => void;
};

export default function VideoGenerationWithReferences({ campaignId, onVideoGenerated }: Props) {
  const [prompt, setPrompt] = useState("");
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("sora-2-pro");
  const [duration, setDuration] = useState(6);
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([]);
  const [referenceImageInput, setReferenceImageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedVideo, setGeneratedVideo] = useState<GenerationResult | null>(null);
  const [models, setModels] = useState<VideoModel[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch available models on mount
  React.useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/video/models`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setModels(data);
        }
      } catch (err) {
        console.error("Failed to fetch video models", err);
      }
    };
    fetchModels();
  }, []);

  const currentModel = useMemo(() => {
    return models.find((m) => m.key === selectedModel);
  }, [models, selectedModel]);

  const handleAddReferenceImageUrl = () => {
    if (referenceImageInput.trim()) {
      setReferenceImageUrls((prev) => [...prev, referenceImageInput.trim()]);
      setReferenceImageInput("");
    }
  };

  const handleRemoveReferenceImage = (index: number) => {
    setReferenceImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    setLoading(true);
    setError("");

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API_BASE_URL}/api/storage/upload`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await res.json();
        if (data.url) {
          setReferenceImageUrls((prev) => [...prev, data.url]);
        }
      }
    } catch (err: any) {
      setError(`Failed to upload reference images: ${err.message}`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) {
      setError("Please enter a video prompt");
      return;
    }

    setLoading(true);
    setError("");
    setGeneratedVideo(null);

    try {
      const payload = {
        prompt: prompt.trim(),
        model: selectedModel,
        duration,
        refinementPrompt: refinementPrompt.trim() || undefined,
        referenceImageUrls: referenceImageUrls.length > 0 ? referenceImageUrls : undefined,
      };

      const res = await fetch(`${API_BASE_URL}/api/video/generate`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Generation failed (${res.status})`);
      }

      const result = await res.json();
      setGeneratedVideo(result);

      if (onVideoGenerated) {
        onVideoGenerated(result);
      }
    } catch (err: any) {
      setError(`Video generation failed: ${err.message}`);
      console.error("Video generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-b from-slate-50 to-slate-100 rounded-lg border border-slate-200">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Video Generation with Sora 2</h2>
        <p className="text-slate-600">
          Generate professional videos with optional brand logo or reference image support
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Video Prompt Input */}
      <div className="space-y-2">
        <label className="block font-semibold text-slate-900">
          Video Prompt <span className="text-red-500">*</span>
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the video you want to generate. Be specific about scene, style, movement, etc."
          className="w-full h-24 p-3 border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <p className="text-xs text-slate-600">
          💡 Tip: More detailed prompts yield better results. Include cinematography style, colors, mood, etc.
        </p>
      </div>

      {/* Reference Images Section */}
      <div className="space-y-3 p-4 bg-white border border-slate-200 rounded">
        <div className="flex items-center justify-between">
          <label className="font-semibold text-slate-900">
            Reference Images (Brand Logo / Style)
          </label>
          {currentModel?.supportsReferenceImages && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              Supported
            </span>
          )}
          {!currentModel?.supportsReferenceImages && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Not supported by {selectedModel}
            </span>
          )}
        </div>

        {/* Add Reference Image URL */}
        <div className="flex gap-2">
          <input
            type="url"
            value={referenceImageInput}
            onChange={(e) => setReferenceImageInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleAddReferenceImageUrl();
              }
            }}
            placeholder="https://example.com/logo.png or paste image URL"
            className="flex-1 px-3 py-2 border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={loading}
          />
          <button
            onClick={handleAddReferenceImageUrl}
            disabled={loading || !referenceImageInput.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-slate-300 text-sm font-medium"
          >
            Add URL
          </button>
        </div>

        {/* Or Upload Image */}
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={loading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded text-slate-600 hover:border-blue-500 hover:text-blue-600 transition text-sm font-medium"
          >
            📤 Upload Reference Images
          </button>
        </div>

        {/* Display Added References */}
        {referenceImageUrls.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              {referenceImageUrls.length} reference image(s) added:
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {referenceImageUrls.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={url}
                    alt={`Reference ${idx}`}
                    className="w-full h-20 object-cover rounded border border-slate-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3EInvalid Image%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <button
                    onClick={() => handleRemoveReferenceImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <label className="font-semibold text-slate-900">Video Model</label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={loading}
          className="w-full px-3 py-2 border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {models.map((model) => (
            <option key={model.key} value={model.key}>
              {model.name} (⭐ {model.quality}) - {model.durationRange.min}-{model.durationRange.max}s
            </option>
          ))}
        </select>
        {currentModel && (
          <p className="text-xs text-slate-600">{currentModel.description}</p>
        )}
      </div>

      {/* Duration Slider */}
      <div className="space-y-2">
        <label className="font-semibold text-slate-900">
          Video Duration: {duration}s
          {currentModel && (
            <span className="text-xs text-slate-600 ml-2">
              ({currentModel.durationRange.min}-{currentModel.durationRange.max}s)
            </span>
          )}
        </label>
        <input
          type="range"
          min={currentModel?.durationRange.min || 5}
          max={currentModel?.durationRange.max || 60}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          disabled={loading}
          className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Advanced Options */}
      <div className="space-y-2">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {showAdvanced ? "▼" : "▶"} Advanced Options
        </button>

        {showAdvanced && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Refinement Instructions (Optional)
              </label>
              <textarea
                value={refinementPrompt}
                onChange={(e) => setRefinementPrompt(e.target.value)}
                placeholder="E.g., 'Make it cinematic with dramatic lighting' or 'Add motion graphics elements'"
                className="w-full h-20 p-2 border border-slate-300 rounded bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={loading}
              />
              <p className="text-xs text-slate-600 mt-1">
                AI will use this to refine and improve your prompt before generation
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateVideo}
        disabled={loading || !prompt.trim()}
        className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded hover:from-blue-600 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-300 transition duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin">⚙️</span>
            Generating Video...
          </>
        ) : (
          <>
            🎬 Generate Video
          </>
        )}
      </button>

      {/* Generated Video Preview */}
      {generatedVideo && (
        <div className="p-4 bg-white border-2 border-green-200 rounded space-y-3">
          <p className="font-semibold text-green-700">✅ Video Generated Successfully!</p>

          <video
            controls
            className="w-full bg-black rounded"
            src={generatedVideo.videoUrl}
          >
            Your browser does not support the video tag.
          </video>

          <div className="space-y-2 text-sm">
            <div>
              <p className="font-medium text-slate-900">Model:</p>
              <p className="text-slate-600">{generatedVideo.model}</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Duration:</p>
              <p className="text-slate-600">{generatedVideo.duration} seconds</p>
            </div>
            {generatedVideo.refinedPrompt && (
              <div>
                <p className="font-medium text-slate-900">Refined Prompt:</p>
                <p className="text-slate-600 italic">{generatedVideo.refinedPrompt}</p>
              </div>
            )}
            <div>
              <p className="font-medium text-slate-900">Generated At:</p>
              <p className="text-slate-600">
                {new Date(generatedVideo.metadata.generatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <a
              href={generatedVideo.videoUrl}
              download={`video-${Date.now()}.mp4`}
              className="flex-1 py-2 bg-blue-500 text-white text-center rounded hover:bg-blue-600 text-sm font-medium transition"
            >
              📥 Download Video
            </a>
            <button
              onClick={() => setGeneratedVideo(null)}
              className="flex-1 py-2 bg-slate-200 text-slate-900 rounded hover:bg-slate-300 text-sm font-medium transition"
            >
              Generate Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

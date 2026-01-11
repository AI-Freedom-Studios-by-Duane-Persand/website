"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

type ContentType =
  | "prompt-improvement"
  | "image-generation"
  | "video-generation"
  | "caption-generation"
  | "script-generation"
  | "hashtag-generation";

export default function ModelsPage() {
  const [contentType, setContentType] = useState<ContentType>("image-generation");
  const [models, setModels] = useState<any[]>([]);
  const [recommendedModel, setRecommendedModel] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("Futuristic cityscape, cyberpunk aesthetic, neon, Blade Runner");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string>("");

  async function fetchModels() {
    try {
      setLoading(true);
      setResult("");
      const res = await axios.get(`/api/ai-models/available`, { params: { contentType } });
      const available = res.data?.availableModels || res.data?.models || [];
      setModels(available);
      const rec = res.data?.recommendedModel || available[0]?.model || "";
      setRecommendedModel(rec);
      setSelectedModel(rec);
    } catch (err: any) {
      setResult(`Failed to fetch models: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function generate() {
    try {
      setLoading(true);
      setResult("");
      const res = await axios.post(`/api/poe/generate-with-model`, {
        contentType,
        model: selectedModel,
        prompt,
      });
      setResult(JSON.stringify(res.data, null, 2));
    } catch (err: any) {
      setResult(`Generation failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType]);

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">Model Selection</h1>
      <p className="text-sm text-gray-600">Pick a content type, choose a model, and generate output.</p>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Content Type</label>
        <select
          className="border rounded px-3 py-2"
          value={contentType}
          onChange={(e) => setContentType(e.target.value as ContentType)}
        >
          <option value="prompt-improvement">Prompt Improvement</option>
          <option value="caption-generation">Caption Generation</option>
          <option value="hashtag-generation">Hashtag Generation</option>
          <option value="script-generation">Script Generation</option>
          <option value="image-generation">Image Generation</option>
          <option value="video-generation">Video Generation</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Prompt</label>
        <textarea
          className="border rounded px-3 py-2 w-full h-28"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Models</label>
          {loading && <span className="text-xs text-gray-500">Loading...</span>}
        </div>
        <div className="grid grid-cols-1 gap-2">
          {models.map((m) => (
            <label key={m.model} className="flex items-center gap-3 border rounded px-3 py-2">
              <input
                type="radio"
                name="model"
                value={m.model}
                checked={selectedModel === m.model}
                onChange={() => setSelectedModel(m.model)}
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{m.displayName || m.model}</div>
                <div className="text-xs text-gray-500">{m.description || m.provider}</div>
              </div>
              {recommendedModel === m.model && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Recommended</span>
              )}
            </label>
          ))}
          {models.length === 0 && !loading && (
            <div className="text-xs text-gray-500">No models found for {contentType}</div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={fetchModels}
          className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded"
          disabled={loading}
        >Refresh Models</button>
        <button
          onClick={generate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          disabled={loading}
        >Generate</button>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Result</label>
        <pre className="border rounded px-3 py-2 text-xs bg-gray-50 overflow-auto max-h-96">{result}</pre>
      </div>
    </div>
  );
}

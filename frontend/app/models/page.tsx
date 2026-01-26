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

const CONTENT_TYPE_TO_SYSTEM_PROMPT: Record<ContentType, string> = {
  "prompt-improvement": "prompt-improver",
  "caption-generation": "social-post",
  "script-generation": "ad-script",
  "hashtag-generation": "social-post",
  "image-generation": "creative-image",
  "video-generation": "creative-video",
};

const AVAILABLE_MODELS = {
  text: ["gpt-4o", "claude-3.5-sonnet", "claude-3-opus"],
  image: ["dall-e-3", "stable-diffusion-xl"],
  video: ["sora-2", "veo-3.1", "runway-gen3"],
};

export default function ModelsPage() {
  const [contentType, setContentType] = useState<ContentType>("image-generation");
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("Futuristic cityscape, cyberpunk aesthetic, neon, Blade Runner");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string>("");

  function getModelsForContentType(type: ContentType): string[] {
    if (type === "image-generation") return AVAILABLE_MODELS.image;
    if (type === "video-generation") return AVAILABLE_MODELS.video;
    return AVAILABLE_MODELS.text;
  }

  function fetchModels() {
    const available = getModelsForContentType(contentType);
    setModels(available);
    setSelectedModel(available[0] || "");
  }

  async function generate() {
    try {
      setLoading(true);
      setResult("");
      
      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      if (!token) {
        setResult("Error: No authentication token found");
        return;
      }

      // Parse JWT to get tenantId
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      const tenantId = payload.tenantId;

      if (!tenantId) {
        setResult("Error: Tenant ID not found in token");
        return;
      }

      let endpoint = "";
      let requestBody: any = {
        prompt,
        model: selectedModel,
        tenant_id: tenantId,
      };

      if (contentType === "image-generation") {
        endpoint = "/v1/content/generate/image";
        requestBody.resolution = "1024x1024";
        requestBody.style = "vivid";
      } else if (contentType === "video-generation") {
        endpoint = "/v1/content/generate/video";
        requestBody.duration_seconds = 8;
        requestBody.aspect_ratio = "16:9";
      } else {
        endpoint = "/v1/content/generate/text";
        requestBody.system_prompt_type = CONTENT_TYPE_TO_SYSTEM_PROMPT[contentType];
        requestBody.max_tokens = 2000;
        requestBody.temperature = 0.7;
      }

      const res = await axios.post(endpoint, requestBody, {
        headers: { Authorization: `Bearer ${token}` },
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
        </div>
        <div className="grid grid-cols-1 gap-2">
          {models.map((m) => (
            <label key={m} className="flex items-center gap-3 border rounded px-3 py-2">
              <input
                type="radio"
                name="model"
                value={m}
                checked={selectedModel === m}
                onChange={(e) => setSelectedModel(e.target.value)}
              />
              <span>{m}</span>
            </label>
          ))}
          {models.length === 0 && !loading && (
            <div className="text-xs text-gray-500">No models found for {contentType}</div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
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

"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

export interface Model {
  model: string;
  displayName: string;
  provider?: string;
  recommended?: boolean;
  description?: string;
  tier?: "free" | "pro" | "enterprise";
  capabilities?: {
    supportsText: boolean;
    supportsImages: boolean;
    supportsVideo: boolean;
    isMultimodal: boolean;
  };
}

export interface ModelPickerModalProps {
  isOpen: boolean;
  contentType: "caption-generation" | "image-generation" | "video-generation";
  onSelect: (model: string) => void;
  onClose: () => void;
  getAuthHeaders: () => Record<string, string>;
  apiUrl: string;
}

export function ModelPickerModal({
  isOpen,
  contentType,
  onSelect,
  onClose,
  getAuthHeaders,
  apiUrl,
}: ModelPickerModalProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [recommendedModel, setRecommendedModel] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchModels();
    }
  }, [isOpen, contentType]);

  async function fetchModels() {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${apiUrl}/api/ai-models/available`, {
        params: { contentType },
        headers: getAuthHeaders(),
      });
      const available = res.data?.availableModels || res.data?.models || [];
      const rec = res.data?.recommendedModel || available[0]?.model || "";
      setModels(available);
      setRecommendedModel(rec);
      setSelectedModel(rec);
    } catch (err: any) {
      setError(`Failed to fetch models: ${err.message}`);
      setModels([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect() {
    if (selectedModel) {
      onSelect(selectedModel);
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Select Model</h2>
          <p className="text-sm text-gray-500">{contentType}</p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="text-center py-8 text-gray-500">Loading models...</div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-4">
              {error}
            </div>
          )}

          {!loading && models.length > 0 && (
            <div className="space-y-2">
              {models.map((m) => (
                <label
                  key={m.model}
                  className="flex items-start gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="model"
                    value={m.model}
                    checked={selectedModel === m.model}
                    onChange={() => setSelectedModel(m.model)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{m.displayName || m.model}</div>
                    {m.description && (
                      <div className="text-xs text-gray-500 line-clamp-2">{m.description}</div>
                    )}
                    {m.provider && (
                      <div className="text-xs text-gray-400 mt-1">{m.provider}</div>
                    )}
                  </div>
                  {recommendedModel === m.model && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded whitespace-nowrap">
                      Recommended
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}

          {!loading && models.length === 0 && !error && (
            <div className="text-center py-8 text-gray-500">No models available</div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedModel}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Select Model
          </button>
        </div>
      </div>
    </div>
  );
}

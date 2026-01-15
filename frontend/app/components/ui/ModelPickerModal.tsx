"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { getAuthHeaders } from "../../../lib/utils/auth-headers";

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
  apiUrl?: string;
}

export function ModelPickerModal({
  isOpen,
  contentType,
  onSelect,
  onClose,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "",
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Model" size="md">
      <div className="min-h-[300px]">
        <p className="text-sm text-slate-400 mb-4">{contentType}</p>

        {loading && (
          <div className="text-center py-8 text-slate-400">Loading models...</div>
        )}

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {!loading && models.length > 0 && (
          <div className="space-y-2 mb-4">
            {models.map((m) => (
              <label
                key={m.model}
                className="flex items-start gap-3 p-3 border border-white/10 rounded-lg hover:bg-white/5 cursor-pointer transition"
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
                  <div className="text-sm font-medium text-white">
                    {m.displayName || m.model}
                  </div>
                  {m.description && (
                    <div className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {m.description}
                    </div>
                  )}
                  {m.provider && (
                    <div className="text-xs text-slate-500 mt-1">{m.provider}</div>
                  )}
                </div>
                {recommendedModel === m.model && (
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full whitespace-nowrap">
                    Recommended
                  </span>
                )}
              </label>
            ))}
          </div>
        )}

        {!loading && models.length === 0 && !error && (
          <div className="text-center py-8 text-slate-400">No models available</div>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedModel}
            variant="primary"
          >
            Select Model
          </Button>
        </div>
      </div>
    </Modal>
  );
}

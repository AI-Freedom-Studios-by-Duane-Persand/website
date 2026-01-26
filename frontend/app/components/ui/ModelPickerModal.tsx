"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

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

const AVAILABLE_MODELS: Record<string, Model[]> = {
  "caption-generation": [
    { model: "gpt-4o", displayName: "GPT-4o", provider: "OpenAI", recommended: true, description: "Advanced text generation" },
    { model: "claude-3.5-sonnet", displayName: "Claude 3.5 Sonnet", provider: "Anthropic", description: "Fast and intelligent" },
    { model: "claude-3-opus", displayName: "Claude 3 Opus", provider: "Anthropic", description: "Most capable Claude model" },
  ],
  "image-generation": [
    { model: "dall-e-3", displayName: "DALL-E 3", provider: "OpenAI", recommended: true, description: "Photorealistic images" },
    { model: "stable-diffusion-xl", displayName: "Stable Diffusion XL", provider: "Stability AI", description: "Fast image generation" },
  ],
  "video-generation": [
    { model: "sora-2", displayName: "Sora 2", provider: "OpenAI", recommended: true, description: "High-quality video generation" },
    { model: "veo-3.1", displayName: "Veo 3.1", provider: "Google", description: "Natural video motion" },
    { model: "runway-gen3", displayName: "Runway Gen-3", provider: "Runway", description: "Creative video effects" },
  ],
};

export function ModelPickerModal({
  isOpen,
  contentType,
  onSelect,
  onClose,
}: ModelPickerModalProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [recommendedModel, setRecommendedModel] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetchModels();
    }
  }, [isOpen, contentType]);

  function fetchModels() {
    const available = AVAILABLE_MODELS[contentType] || [];
    const rec = available.find(m => m.recommended)?.model || available[0]?.model || "";
    setModels(available);
    setRecommendedModel(rec);
    setSelectedModel(rec);
  }

  function handleSelect() {
    if (selectedModel) {
      onSelect(selectedModel);
      onClose();
  function fetchModels() {
    const available = AVAILABLE_MODELS[contentType] || [];
    const rec = available.find(m => m.recommended)?.model || available[0]?.model || "";
    setModels(available);
    setRecommendedModel(rec);
    setSelectedModel(rec);
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

        {models.length > 0 && (
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

        {models.length === 0 && (
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

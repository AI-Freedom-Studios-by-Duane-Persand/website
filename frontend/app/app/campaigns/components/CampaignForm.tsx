"use client";

import React, { useState, useEffect } from "react";

type Props = {
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  fetchCampaigns: () => Promise<void> | void;
  setError: React.Dispatch<React.SetStateAction<string>>;
};

function CampaignForm({ step, setStep, fetchCampaigns, setError }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState(0);
  const [userId, setUserId] = useState("");

  // Automatically set userId from localStorage if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("userId") || localStorage.getItem("token") || localStorage.getItem("auth_token");
      if (stored) setUserId(stored);
    }
  }, []);
  const [campaignId, setCampaignId] = useState("");
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [isVersioning, setIsVersioning] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRollback, setIsRollback] = useState(false);
  const [revision, setRevision] = useState(1);
  const [section, setSection] = useState<"strategy" | "content" | "schedule" | "ads">("strategy");

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";

  const getAuthHeaders = (): HeadersInit => {
    if (typeof window === "undefined") {
      return { "Content-Type": "application/json" };
    }

    const token =
      localStorage.getItem("token") || localStorage.getItem("auth_token");

    return token
      ? {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      : {
          "Content-Type": "application/json",
        };
  };

  const createDraftCampaign = async () => {
    setError("");

    if (!userId) {
      setError("User ID is missing. Please log in again.");
      console.error("[CampaignForm] User ID is missing. Cannot create draft campaign.");
      return;
    }
    if (!title || !description) {
      setError("Please fill Campaign name and Description.");
      console.warn("[CampaignForm] Title or description missing.", { title, description });
      return;
    }

    setIsCreatingDraft(true);
    try {
      const payload = {
        name: title,
        title,
        description,
        budget,
        userId,
        createdBy: userId,
        status: "draft",
      };
      console.log("[CampaignForm] Creating draft campaign with payload:", payload);
      const res = await fetch(`${API_BASE_URL}/api/campaigns`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      console.log("[CampaignForm] Draft campaign creation response status:", res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("[CampaignForm] Failed to create draft campaign. Response:", errorText);
        throw new Error("Failed to create draft campaign");
      }

      const data = await res.json();
      console.log("[CampaignForm] Draft campaign created successfully:", data);
      setCampaignId(data._id || data.id);
      setStep(2);
      await fetchCampaigns();
    } catch (err: any) {
      setError(err?.message || "Error creating draft campaign");
      console.error("[CampaignForm] Error creating draft campaign:", err);
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const addStrategyVersion = async () => {
    if (!campaignId || !userId) return;

    setIsVersioning(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/campaigns/${campaignId}/strategy-version`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            strategyData: {},
            userId,
            note: "User triggered new strategy version",
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to add strategy version");
      await fetchCampaigns();
    } catch (err: any) {
      setError(err?.message || "Error adding strategy version");
    } finally {
      setIsVersioning(false);
    }
  };

  const approveSection = async () => {
    if (!campaignId || !userId) return;

    setIsApproving(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/campaigns/${campaignId}/approve/${section}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ userId, note: `User approved ${section}` }),
        }
      );

      if (!res.ok) throw new Error("Failed to approve section");
      await fetchCampaigns();
    } catch (err: any) {
      setError(err?.message || "Error approving section");
    } finally {
      setIsApproving(false);
    }
  };

  const rollbackToRevision = async () => {
    if (!campaignId || !userId) return;

    setIsRollback(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}/rollback`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          revision,
          userId,
          note: "User triggered rollback",
        }),
      });

      if (!res.ok) throw new Error("Failed to rollback");
      await fetchCampaigns();
    } catch (err: any) {
      setError(err?.message || "Error during rollback");
    } finally {
      setIsRollback(false);
    }
  };

  return (
    <div className="p-4 bg-white/10 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Create Campaign</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">Budget</label>
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white"
        />
      </div>

      <button
        onClick={createDraftCampaign}
        disabled={isCreatingDraft}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
      >
        {isCreatingDraft ? "Creating..." : "Create Draft"}
      </button>

      {campaignId && (
        <div className="mt-6 space-y-4">
          <div>
            <button
              onClick={addStrategyVersion}
              disabled={isVersioning}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 mr-2 disabled:opacity-60"
            >
              {isVersioning ? "Adding..." : "Add Strategy Version"}
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Section to Approve</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value as any)}
              className="px-2 py-1 rounded bg-gray-800 text-white"
            >
              <option value="strategy">Strategy</option>
              <option value="content">Content</option>
              <option value="schedule">Schedule</option>
              <option value="ads">Ads</option>
            </select>

            <button
              onClick={approveSection}
              disabled={isApproving}
              className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
            >
              {isApproving ? "Approving..." : "Approve Section"}
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Rollback to Revision</label>
            <input
              type="number"
              min={1}
              value={revision}
              onChange={(e) => setRevision(Number(e.target.value))}
              className="px-2 py-1 rounded bg-gray-800 text-white w-20"
            />
            <button
              onClick={rollbackToRevision}
              disabled={isRollback}
              className="ml-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
            >
              {isRollback ? "Rolling back..." : "Rollback"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignForm;

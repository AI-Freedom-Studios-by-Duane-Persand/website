"use client";

import React from "react";
import { Card, Badge, Button } from "../ui";
import type { Campaign } from "../../../lib/api/campaigns.api";

export interface CampaignListProps {
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;
  onEdit: (campaignId: string) => void;
  onDelete: (campaignId: string) => void;
  onRefresh?: () => void;
}

export const CampaignList: React.FC<CampaignListProps> = ({
  campaigns,
  loading,
  error,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return <p className="text-slate-300 animate-pulse">Loading campaigns...</p>;
  }

  if (error) {
    return (
      <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
        {error}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="mt-6">
        <div className="text-center py-12 rounded-2xl border border-white/10 bg-white/5">
          <div className="text-slate-400 text-sm">
            No campaigns yet. Start by creating one above.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <ul className="space-y-3">
        {campaigns.map((campaign) => (
          <Card key={campaign._id} hover>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{campaign.name}</h3>
                {campaign.objective && (
                  <p className="mt-1 text-sm text-slate-300">{campaign.objective}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="default">{campaign.status || "draft"}</Badge>
                  {campaign.strategyVersions && campaign.strategyVersions.length > 0 && (
                    <Badge variant="primary">
                      {campaign.strategyVersions.length} strategy versions
                    </Badge>
                  )}
                  {campaign.contentVersions && campaign.contentVersions.length > 0 && (
                    <Badge variant="success">
                      {campaign.contentVersions.length} content versions
                    </Badge>
                  )}
                </div>
                {campaign.createdAt && (
                  <p className="mt-2 text-xs text-slate-500">
                    Created {new Date(campaign.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => onEdit(campaign._id)}
                  variant="secondary"
                  size="sm"
                >
                  💬 Edit in Chat
                </Button>
                <Button
                  onClick={() => onDelete(campaign._id)}
                  variant="danger"
                  size="sm"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </ul>
    </div>
  );
};

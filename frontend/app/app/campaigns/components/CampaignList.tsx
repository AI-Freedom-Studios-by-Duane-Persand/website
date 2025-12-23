import React from "react";

interface Campaign {
  _id: string;
  name: string;
  objective?: string;
  status: string;
  strategyVersions?: any[];
  contentVersions?: any[];
  createdAt?: string;
  updatedAt?: string;
}

const CampaignList = ({ campaigns, loading, error, onEdit, onDelete, onRefresh }) => {
  if (loading) return <p className="text-slate-300 animate-pulse">Loading campaigns...</p>;
  if (error) return <p className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">{error}</p>;

  return (
    <div className="mt-6">
      {campaigns.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-white/10 bg-white/5">
          <div className="text-slate-400 text-sm">No campaigns yet. Start by creating one above.</div>
        </div>
      ) : (
        <ul className="space-y-3">
          {campaigns.map((campaign) => (
            <li
              key={campaign._id}
              className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.07] transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{campaign.name}</h3>
                  {campaign.objective && (
                    <p className="mt-1 text-sm text-slate-300">{campaign.objective}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full px-3 py-1 bg-white/10 border border-white/10 text-slate-200">
                      {campaign.status || "draft"}
                    </span>
                    {campaign.strategyVersions && campaign.strategyVersions.length > 0 && (
                      <span className="rounded-full px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-200">
                        {campaign.strategyVersions.length} strategy versions
                      </span>
                    )}
                    {campaign.contentVersions && campaign.contentVersions.length > 0 && (
                      <span className="rounded-full px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-200">
                        {campaign.contentVersions.length} content versions
                      </span>
                    )}
                  </div>
                  {campaign.createdAt && (
                    <p className="mt-2 text-xs text-slate-500">
                      Created {new Date(campaign.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(campaign._id)}
                    className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-slate-200 text-sm font-semibold hover:bg-white/15 transition"
                  >
                    💬 Edit in Chat
                  </button>
                  <button
                    onClick={() => onDelete(campaign._id)}
                    className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-semibold hover:bg-red-500/20 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CampaignList;
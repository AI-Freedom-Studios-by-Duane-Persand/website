import React from "react";

const CampaignsPanel = () => {
  return (
    <div>
      <h3 className="text-md font-semibold text-slate-900">Your Campaigns</h3>
      <p className="text-sm text-slate-600 mb-4">
        No campaigns available. Start by creating a new campaign.
      </p>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        onClick={() => alert("Create Campaign functionality coming soon!")}
      >
        Create Campaign
      </button>
    </div>
  );
};

export default CampaignsPanel;
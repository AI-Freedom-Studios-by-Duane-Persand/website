import React from 'react';

interface CampaignListProps {
  campaigns: Array<{
    id: string;
    title: string;
    description: string;
    budget: number;
    metaPostStatus?: string;
    adsStatus?: string;
  }>;
}

const CampaignList: React.FC<CampaignListProps> = ({ campaigns }) => {
  return (
    <ul>
      {campaigns.map((campaign) => (
        <li key={campaign.id}>
          <h3>{campaign.title}</h3>
          <p>{campaign.description}</p>
          <p>Budget: ${campaign.budget}</p>
          {campaign.metaPostStatus && <p>Meta Post Status: {campaign.metaPostStatus}</p>}
          {campaign.adsStatus && <p>Ads Status: {campaign.adsStatus}</p>}
        </li>
      ))}
    </ul>
  );
};

export default CampaignList;
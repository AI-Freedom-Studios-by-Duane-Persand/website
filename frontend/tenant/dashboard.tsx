// Tenant dashboard page

import React, { useEffect, useState } from 'react';
import { useAuthGuard, useSubscriptionGuard } from '../components/guards';
import Layout from '../components/Layout';

export default function Dashboard() {
  useAuthGuard();
  useSubscriptionGuard();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/campaigns`)
      .then(res => res.json())
      .then(setCampaigns)
      .catch(() => setError('Failed to load campaigns'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto w-full px-2 sm:px-4 md:px-0">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Tenant Dashboard</h1>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
          <h2 className="text-xl font-semibold text-gray-700">Campaigns</h2>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={() => window.location.href = '/tenant/campaign'}
            aria-label="Create Campaign"
          >
            Create Campaign
          </button>
        </div>
        {loading ? (
          <div className="text-gray-500">Loading campaigns...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : campaigns.length === 0 ? (
          <div className="text-gray-500">No campaigns found.</div>
        ) : (
          <ul className="space-y-3">
            {campaigns.map(c => (
              <li key={c._id} className="bg-white rounded shadow p-4 flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <span className="font-medium text-gray-800">{c.name}</span>
                  <span className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-600">{c.status}</span>
                </div>
                <button
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition focus:outline-none focus:ring-2 focus:ring-green-400"
                  onClick={() => window.location.href = `/tenant/campaign?edit=${c._id}`}
                  aria-label={`Edit campaign ${c.name}`}
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}


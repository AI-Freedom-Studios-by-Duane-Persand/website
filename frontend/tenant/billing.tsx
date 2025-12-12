import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';

export default function Billing() {
  const [plan, setPlan] = useState('');
  const [renewal, setRenewal] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stripeUrl, setStripeUrl] = useState('');

  useEffect(() => {
    // Fetch billing info from backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    fetch(`${apiUrl}/api/billing/info`)
      .then(res => res.json())
      .then(data => {
        setPlan(data.plan);
        setRenewal(data.renewal);
      })
      .catch(() => setError('Failed to load billing info'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async () => {
    setError('');
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/billing/checkout`, { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        setStripeUrl(data.url);
        window.location.href = data.url;
      } else {
        setError('Failed to start Stripe checkout');
      }
    } catch {
      setError('Failed to start Stripe checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Billing & Subscription</h1>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-red-500 mb-4">{error}</div>
        ) : (
          <div className="bg-white rounded shadow p-6 mb-4">
            <div className="mb-2">
              <span className="font-semibold text-gray-700">Current Plan:</span>
              <span className="ml-2 text-blue-600">{plan}</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold text-gray-700">Renewal Date:</span>
              <span className="ml-2 text-gray-600">{renewal}</span>
            </div>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition mt-4 focus:outline-none focus:ring-2 focus:ring-green-400"
              onClick={handleUpgrade}
              disabled={loading}
              aria-label="Upgrade Plan"
            >
              Upgrade Plan
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

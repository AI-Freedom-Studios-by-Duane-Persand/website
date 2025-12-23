// Campaign creation/editing page
import React, { useEffect, useState } from 'react';
import { useAuthGuard, useSubscriptionGuard } from '../components/guards';
import Layout from '../components/Layout';

export default function Campaign() {
  useAuthGuard();
  useSubscriptionGuard();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [budget, setBudget] = useState(0); // New field for budget
  const [startDate, setStartDate] = useState(''); // New field for start date
  const [endDate, setEndDate] = useState(''); // New field for end date
  const [editId, setEditId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const edit = params.get('edit');
    if (edit) {
      setEditId(edit);
      setLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/campaigns/${edit}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch campaign');
          }
          return res.json();
        })
        .then(data => {
          console.log('Fetched campaign data:', data);
          setName(data.title);
          setDesc(data.description);
          setBudget(data.budget);
          setStartDate(data.startDate);
          setEndDate(data.endDate);
        })
        .catch(err => {
          console.error('Error fetching campaign:', err);
          setError('Failed to load campaign');
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Saving campaign with data:', { name, desc, budget, startDate, endDate });
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const payload = {
        title: name,
        description: desc,
        budget,
        startDate,
        endDate,
        userId: 'user-id-placeholder',
      };

      const response = await fetch(`${apiUrl}/api/campaigns${editId ? `/${editId}` : ''}`, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save campaign');
      }

      console.log('Campaign saved successfully');
      window.location.href = '/tenant/dashboard';
    } catch (err) {
      console.error('Error saving campaign:', err);
      setError(err.message || 'Failed to save campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-screen w-full px-2 sm:px-4 md:px-0">
        <div className="bg-white rounded shadow p-8 w-full max-w-lg">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">{editId ? 'Edit' : 'Create'} Campaign</h1>
          {loading && <div className="text-gray-500 mb-4">Loading...</div>}
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <form onSubmit={e => {e.preventDefault(); handleSave();}} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="campaign-name">Campaign Name</label>
              <input
                id="campaign-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Campaign Name"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
                aria-label="Campaign Name"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="campaign-desc">Description</label>
              <textarea
                id="campaign-desc"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Description"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                rows={4}
                required
                aria-label="Description"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="campaign-budget">Budget</label>
              <input
                id="campaign-budget"
                type="number"
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                placeholder="Budget"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
                aria-label="Budget"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="campaign-start-date">Start Date</label>
              <input
                id="campaign-start-date"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
                aria-label="Start Date"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="campaign-end-date">End Date</label>
              <input
                id="campaign-end-date"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
                aria-label="End Date"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition w-full font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={loading}
              aria-label={editId ? 'Update Campaign' : 'Create Campaign'}
            >
              {editId ? 'Update Campaign' : 'Create Campaign'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

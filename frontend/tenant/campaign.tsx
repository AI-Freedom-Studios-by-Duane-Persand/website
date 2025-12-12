// Campaign creation/editing page
import React, { useEffect, useState } from 'react';
import { useAuthGuard, useSubscriptionGuard } from '../components/guards';
import Layout from '../components/Layout';

export default function Campaign() {
  useAuthGuard();
  useSubscriptionGuard();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState('draft');
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
        .then(res => res.json())
        .then(data => {
          setName(data.name);
          setDesc(data.description);
          setStatus(data.status);
        })
        .catch(() => setError('Failed to load campaign'))
        .finally(() => setLoading(false));
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      if (editId) {
        await fetch(`${apiUrl}/api/campaigns/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description: desc, status }),
        });
      } else {
        await fetch(`${apiUrl}/api/campaigns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description: desc, status }),
        });
      }
      window.location.href = '/tenant/dashboard';
    } catch {
      setError('Failed to save campaign');
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
              <label className="block text-gray-700 mb-2" htmlFor="campaign-status">Status</label>
              <select
                id="campaign-status"
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                aria-label="Status"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
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
// ...existing code...

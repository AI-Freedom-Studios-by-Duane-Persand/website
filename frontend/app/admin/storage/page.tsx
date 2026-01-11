// frontend/app/admin/storage/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const APIURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface R2Config {
  bucketName: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
  region: string;
}

export default function AdminStoragePage() {
  const router = useRouter();
  
  const [config, setConfig] = useState<R2Config | null>(null);
  const [formData, setFormData] = useState<Partial<R2Config>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [refreshingCreatives, setRefreshingCreatives] = useState(false);
  const [refreshSummary, setRefreshSummary] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const authToken = localStorage.getItem('token') || '';
    if (!authToken) {
      router.push('/login');
      return;
    }
    
    setToken(authToken);
    loadConfig();
  }, [router]);

  async function loadConfig() {
    try {
      setLoading(true);
      
      const res = await fetch(`${APIURL}/api/admin/storage/config`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 404) {
          setConfig({ bucketName: '', endpoint: '', accessKeyId: '', secretAccessKey: '', publicBaseUrl: '', region: 'auto' });
          setFormData({ region: 'auto' });
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data: R2Config = await res.json();
      setConfig(data);
      setFormData(data);
      setError(null);
    } catch (err: any) {
      setError(`Failed to load config: ${err.message}`);
      console.error('[AdminStoragePage] Load config error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      
      const res = await fetch(`${APIURL}/api/admin/storage/config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }

      const updated: R2Config = await res.json();
      setConfig(updated);
      setFormData(updated);
      setSuccess('Configuration saved successfully');
    } catch (err: any) {
      setError(`Failed to save config: ${err.message}`);
      console.error('[AdminStoragePage] Save config error:', err);
    }
  }

  async function handleTestConnection() {
    try {
      setError(null);
      setSuccess(null);
      setTestingConnection(true);
      
      const res = await fetch(`${APIURL}/api/admin/storage/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error(`Connection test failed: HTTP ${res.status}`);
      }

      const result = await res.json();
      setSuccess(`Connection successful! Bucket: ${result.bucketName}, Accessible: ${result.accessible ? 'Yes' : 'No'}`);
    } catch (err: any) {
      setError(`Connection test failed: ${err.message}`);
      console.error('[AdminStoragePage] Test connection error:', err);
    } finally {
      setTestingConnection(false);
    }
  }

  async function handleRefreshCreativeImageUrls() {
    try {
      setError(null);
      setSuccess(null);
      setRefreshSummary(null);
      setRefreshingCreatives(true);

      const res = await fetch(`${APIURL}/api/admin/storage/refresh-creative-image-urls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        throw new Error(`Refresh failed: HTTP ${res.status}`);
      }

      const result = await res.json();
      const summary = `Refreshed creative image URLs. Total: ${result.total}, Updated: ${result.updated}, Errors: ${result.errors}`;
      setRefreshSummary(summary);
      setSuccess('Creative image URLs refreshed successfully');
    } catch (err: any) {
      setError(`Failed to refresh creative image URLs: ${err.message}`);
      console.error('[AdminStoragePage] Refresh creative image URLs error:', err);
    } finally {
      setRefreshingCreatives(false);
    }
  }

  function handleInputChange(field: keyof R2Config, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0ea5e9]"></div>
          <p className="mt-4 text-white text-lg">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Cloudflare R2 Configuration</h1>
          <p className="text-slate-400">Manage your R2 storage credentials and settings</p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400 font-semibold">Error</p>
            <p className="text-red-300 text-sm mt-1">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
            <p className="text-green-400 font-semibold">Success</p>
            <p className="text-green-300 text-sm mt-1">{success}</p>
            {refreshSummary && (
              <p className="text-green-200 text-xs mt-1">{refreshSummary}</p>
            )}
          </div>
        )}

        {/* Configuration Form */}
        <form onSubmit={handleSaveConfig} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-6 backdrop-blur-sm">
          
          {/* Bucket Name */}
          <div>
            <label htmlFor="bucketName" className="block text-sm font-semibold text-white mb-2">
              Bucket Name *
            </label>
            <input
              type="text"
              id="bucketName"
              placeholder="e.g., aifreedomstudios"
              value={formData.bucketName || ''}
              onChange={e => handleInputChange('bucketName', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-[#0ea5e9] transition"
            />
            <p className="text-xs text-slate-400 mt-1">Your R2 bucket name (without protocol or domain)</p>
          </div>

          {/* Endpoint */}
          <div>
            <label htmlFor="endpoint" className="block text-sm font-semibold text-white mb-2">
              Endpoint URL *
            </label>
            <input
              type="text"
              id="endpoint"
              placeholder="https://5545f625c2a2800835c41f5a44d14c46.r2.cloudflarestorage.com"
              value={formData.endpoint || ''}
              onChange={e => handleInputChange('endpoint', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-[#0ea5e9] transition"
            />
            <p className="text-xs text-slate-400 mt-1">Your R2 S3-compatible endpoint URL</p>
          </div>

          {/* Public Base URL */}
          <div>
            <label htmlFor="publicBaseUrl" className="block text-sm font-semibold text-white mb-2">
              Public Base URL
            </label>
            <input
              type="text"
              id="publicBaseUrl"
              placeholder="https://cdn.yourdomain.com or https://bucket.r2.cloudflarestorage.com"
              value={formData.publicBaseUrl || ''}
              onChange={e => handleInputChange('publicBaseUrl', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-[#0ea5e9] transition"
            />
            <p className="text-xs text-slate-400 mt-1">Public URL for accessing stored files (optional; defaults to endpoint)</p>
          </div>

          {/* Access Key ID */}
          <div>
            <label htmlFor="accessKeyId" className="block text-sm font-semibold text-white mb-2">
              Access Key ID *
            </label>
            <input
              type="text"
              id="accessKeyId"
              placeholder="Your R2 access key ID"
              value={formData.accessKeyId || ''}
              onChange={e => handleInputChange('accessKeyId', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-[#0ea5e9] transition"
            />
            <p className="text-xs text-slate-400 mt-1">Used to authenticate with R2. Keep this secret!</p>
          </div>

          {/* Secret Access Key */}
          <div>
            <label htmlFor="secretAccessKey" className="block text-sm font-semibold text-white mb-2">
              Secret Access Key *
            </label>
            <input
              type="password"
              id="secretAccessKey"
              placeholder="Your R2 secret access key"
              value={formData.secretAccessKey || ''}
              onChange={e => handleInputChange('secretAccessKey', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-[#0ea5e9] transition"
            />
            <p className="text-xs text-slate-400 mt-1">Used to authenticate with R2. Keep this secret!</p>
          </div>

          {/* Region */}
          <div>
            <label htmlFor="region" className="block text-sm font-semibold text-white mb-2">
              Region
            </label>
            <input
              type="text"
              id="region"
              placeholder="auto"
              value={formData.region || 'auto'}
              onChange={e => handleInputChange('region', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-[#0ea5e9] transition"
            />
            <p className="text-xs text-slate-400 mt-1">R2 region (typically 'auto' for Cloudflare)</p>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4 border-t border-slate-700">
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-[#0ea5e9] to-[#06b6d4] text-white font-semibold rounded hover:shadow-lg hover:shadow-[#0ea5e9]/50 transition"
            >
              Save Configuration
            </button>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="px-6 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white font-semibold rounded border border-slate-600 transition disabled:opacity-50"
            >
              {testingConnection ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
        </form>

        {/* Current Config Display */}
        {config && (
          <div className="mt-8 bg-slate-800/30 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Current Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Bucket Name</p>
                <p className="text-white font-mono">{config.bucketName || '(not configured)'}</p>
              </div>
              <div>
                <p className="text-slate-400">Region</p>
                <p className="text-white font-mono">{config.region || 'auto'}</p>
              </div>
              <div>
                <p className="text-slate-400">Endpoint</p>
                <p className="text-white font-mono text-xs break-all">{config.endpoint || '(not configured)'}</p>
              </div>
              <div>
                <p className="text-slate-400">Public Base URL</p>
                <p className="text-white font-mono text-xs break-all">{config.publicBaseUrl || '(uses endpoint)'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
          <h4 className="text-white font-semibold mb-2">How to Get R2 Credentials</h4>
          <ol className="text-slate-300 text-sm space-y-2 list-decimal list-inside">
            <li>Log into your Cloudflare account</li>
            <li>Navigate to <strong>R2</strong> → <strong>API Tokens</strong></li>
            <li>Click <strong>Create API Token</strong></li>
            <li>Select <strong>Object Read & Write</strong> permissions</li>
            <li>Copy the <strong>Access Key ID</strong> and <strong>Secret Access Key</strong></li>
            <li>Find your bucket endpoint in the R2 bucket settings</li>
          </ol>
        </div>

        {/* Maintenance actions */}
        <div className="mt-8 bg-slate-800/40 border border-slate-700 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Maintenance</h2>
          <p className="text-sm text-slate-400">
            Run maintenance tasks related to R2 storage and creative assets.
          </p>

          <button
            type="button"
            onClick={handleRefreshCreativeImageUrls}
            disabled={refreshingCreatives}
            className="inline-flex items-center px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium shadow-sm transition"
          >
            {refreshingCreatives ? 'Refreshing creative image URLs…' : 'Refresh creative image URLs'}
          </button>
        </div>
      </div>
    </div>
  );
}

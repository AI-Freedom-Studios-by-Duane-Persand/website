// frontend/app/tenant/approvals/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { campaignsApi } from '@/lib/api/campaigns.api';
import { approvalsApi, type ApprovalState, type CampaignWithApprovals } from '@/lib/api/approvals.api';
import { parseApiError, getUserMessage } from '@/lib/error-handler';

const SCOPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  strategy: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: '📋' },
  content: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: '✍️' },
  schedule: { bg: 'bg-green-500/20', text: 'text-green-400', icon: '📅' },
  ads: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: '📢' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pending' },
  approved: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Approved' },
  rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Rejected' },
  needs_review: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Needs Review' },
};

export default function ApprovalsPage() {
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<CampaignWithApprovals[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignWithApprovals | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectionScope, setRejectionScope] = useState<'strategy' | 'content' | 'schedule' | 'ads' | null>(null);
  const [tenantId, setTenantId] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = apiClient.parseToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const tenant = token.tenantId || localStorage.getItem('tenantId') || '';
    setTenantId(tenant);
    void loadCampaigns(tenant);
  }, [router]);

  const loadCampaigns = async (currentTenantId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await campaignsApi.list(currentTenantId ? { tenantId: currentTenantId } : undefined);
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(getUserMessage(parsed));
      console.error('[ApprovalsPage] Load error:', parsed);
    } finally {
      setLoading(false);
    }
  };

  async function handleApprove(campaignId: string, scope: string) {
    try {
      const userId = apiClient.parseToken()?.sub || 'system';
      await approvalsApi.approve(campaignId, scope, userId);
      await loadCampaigns(tenantId);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(getUserMessage(parsed));
      console.error('[ApprovalsPage] Approve error:', parsed);
    }
  }

  async function handleReject(campaignId: string, scope: string) {
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    try {
      const userId = apiClient.parseToken()?.sub || 'system';
      await approvalsApi.reject(campaignId, scope, rejectReason, userId);

      setRejectReason('');
      setRejectionScope(null);
      await loadCampaigns(tenantId);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(getUserMessage(parsed));
      console.error('[ApprovalsPage] Reject error:', parsed);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0ea5e9]"></div>
          <p className="mt-4 text-white text-lg">Loading approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Campaign Approvals</h1>
          <p className="text-slate-400">Review and approve campaign sections (strategy, content, schedule, ads)</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Campaigns List */}
        {campaigns.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No campaigns found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {campaigns.map(campaign => (
              <div key={campaign._id} className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
                {/* Campaign Header */}
                <div className="p-6 border-b border-slate-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{campaign.name}</h2>
                      <p className="text-slate-400 text-sm mt-1">
                        Created {campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded text-sm font-semibold ${STATUS_COLORS[campaign.status || 'pending']?.bg || 'bg-slate-700'}`}>
                      <span className={STATUS_COLORS[campaign.status || 'pending']?.text || 'text-slate-400'}>
                        {(campaign.status || 'pending').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Approval Scopes */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(campaign.approvalStates || {}).map(([scope, approval]) => (
                    <div
                      key={scope}
                      className={`p-4 rounded-lg border ${
                        SCOPE_COLORS[scope]?.bg || 'bg-slate-700/50'
                      } border-slate-600`}
                    >
                      {/* Scope Title & Status */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className={`font-semibold ${SCOPE_COLORS[scope]?.text || 'text-slate-300'}`}>
                            {SCOPE_COLORS[scope]?.icon} {scope.charAt(0).toUpperCase() + scope.slice(1)}
                          </h3>
                          <p className={`text-xs mt-1 ${STATUS_COLORS[approval.status]?.text || 'text-slate-400'}`}>
                            {STATUS_COLORS[approval.status]?.label || 'Unknown'}
                          </p>
                        </div>
                      </div>

                      {/* Approval Details */}
                      {approval.status === 'approved' && (
                        <div className="text-xs text-green-400 space-y-1">
                          <p>✓ Approved {approval.approvedAt ? new Date(approval.approvedAt).toLocaleDateString() : ''}</p>
                          {approval.approvedBy && <p>By: {approval.approvedBy}</p>}
                        </div>
                      )}

                      {approval.status === 'rejected' && (
                        <div className="text-xs text-red-400 space-y-1">
                          <p>✗ Rejected {approval.rejectedAt ? new Date(approval.rejectedAt).toLocaleDateString() : ''}</p>
                          {approval.rejectionReason && <p className="mt-2 text-red-300">{approval.rejectionReason}</p>}
                        </div>
                      )}

                      {approval.status === 'needs_review' && approval.invalidatedAt && (
                        <div className="text-xs text-blue-400 space-y-1">
                          <p>⚠️ Invalidated {new Date(approval.invalidatedAt).toLocaleDateString()}</p>
                          {approval.invalidationReason && <p className="mt-2 text-blue-300">{approval.invalidationReason}</p>}
                        </div>
                      )}

                      {/* Action Buttons */}
                      {(approval.status === 'pending' || approval.status === 'needs_review') && (
                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-600">
                          <button
                            onClick={() => handleApprove(campaign._id, scope)}
                            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCampaign(campaign);
                              setRejectionScope(scope as any);
                            }}
                            className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded transition"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rejection Modal */}
        {selectedCampaign && rejectionScope && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-white mb-4">Reject Approval</h3>
              <p className="text-slate-400 text-sm mb-4">
                {selectedCampaign.name} — {rejectionScope}
              </p>

              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Please explain why this needs to be rejected..."
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-[#0ea5e9] transition h-32 resize-none mb-4"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedCampaign(null);
                    setRejectionScope(null);
                    setRejectReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white font-semibold rounded transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedCampaign._id, rejectionScope)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded transition"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

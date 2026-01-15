/**
 * React Hooks for Campaigns API
 * Provides typed access to campaign data with loading and error states
 */
'use client';

import { useState, useCallback } from 'react';
import { campaignsApi } from '../api/campaigns.api';
import { parseApiError, FormattedError } from '../error-handler';

export interface UseCampaignsState {
  campaigns: any[];
  loading: boolean;
  error: FormattedError | null;
}

export interface UseCampaign {
  campaign: any | null;
  loading: boolean;
  error: FormattedError | null;
}

/**
 * Hook for listing campaigns
 */
export function useCampaigns() {
  const [state, setState] = useState<UseCampaignsState>({
    campaigns: [],
    loading: false,
    error: null,
  });

  const fetch = useCallback(async (query?: Record<string, any>) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await campaignsApi.list(query);
      setState({ campaigns: data, loading: false, error: null });
      return data;
    } catch (error) {
      const formatted = parseApiError(error);
      setState({ campaigns: [], loading: false, error: formatted });
      throw error;
    }
  }, []);

  const create = useCallback(
    async (dto: any) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const newCampaign = await campaignsApi.create(dto);
        setState((prev) => ({
          ...prev,
          campaigns: [...prev.campaigns, newCampaign],
          loading: false,
        }));
        return newCampaign;
      } catch (error) {
        const formatted = parseApiError(error);
        setState((prev) => ({ ...prev, loading: false, error: formatted }));
        throw error;
      }
    },
    []
  );

  return { ...state, fetch, create };
}

/**
 * Hook for getting campaign by ID
 */
export function useCampaign(id: string | null) {
  const [state, setState] = useState<UseCampaign>({
    campaign: null,
    loading: false,
    error: null,
  });

  const fetch = useCallback(async () => {
    if (!id) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await campaignsApi.getById(id);
      setState({ campaign: data, loading: false, error: null });
      return data;
    } catch (error) {
      const formatted = parseApiError(error);
      setState({ campaign: null, loading: false, error: formatted });
      throw error;
    }
  }, [id]);

  const update = useCallback(
    async (dto: any) => {
      if (!id) return;
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const updated = await campaignsApi.update(id, dto);
        setState({ campaign: updated, loading: false, error: null });
        return updated;
      } catch (error) {
        const formatted = parseApiError(error);
        setState((prev) => ({ ...prev, loading: false, error: formatted }));
        throw error;
      }
    },
    [id]
  );

  const remove = useCallback(async () => {
    if (!id) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await campaignsApi.delete(id);
      setState({ campaign: null, loading: false, error: null });
    } catch (error) {
      const formatted = parseApiError(error);
      setState((prev) => ({ ...prev, loading: false, error: formatted }));
      throw error;
    }
  }, [id]);

  return { ...state, fetch, update, remove };
}

/**
 * Hook for campaign strategies
 */
export function useCampaignStrategies(campaignId: string | null) {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FormattedError | null>(null);

  const fetch = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await campaignsApi.getStrategies(campaignId);
      setStrategies(data);
    } catch (err) {
      const formatted = parseApiError(err);
      setError(formatted);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  return { strategies, loading, error, fetch };
}

/**
 * Hook for campaign approvals
 */
export function useCampaignApprovals(campaignId: string | null) {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FormattedError | null>(null);

  const fetch = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await campaignsApi.getApprovals(campaignId);
      setApprovals(data);
    } catch (err) {
      const formatted = parseApiError(err);
      setError(formatted);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  return { approvals, loading, error, fetch };
}

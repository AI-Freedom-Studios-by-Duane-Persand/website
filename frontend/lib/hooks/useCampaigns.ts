'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { campaignsApi } from '../api/campaigns.api';
import { parseApiError, getUserMessage } from '../error-handler';

export function useCampaigns() {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await campaignsApi.list();
      setData(res as any);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(getUserMessage(parsed));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void list();
  }, [list]);

  return useMemo(() => ({ data, loading, error, list }), [data, loading, error, list]);
}

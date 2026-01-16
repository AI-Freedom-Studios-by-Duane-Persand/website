'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface UserInfo {
  userId: string;
  email: string;
  roles: string[];
  isEarlyAccess: boolean;
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (!token) {
      router.push('/');
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';

    fetch(`${apiUrl}/auth/me`, {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch user info:', err);
        setError(err.message || 'Failed to load user info');
        setLoading(false);
      });
  }, [router]);

  return { user, loading, error, hasEarlyAccess: user?.isEarlyAccess === true };
}

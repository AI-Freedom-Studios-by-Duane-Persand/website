import { useEffect } from 'react';
import { useRouter } from 'next/router';

export function useAuthGuard() {
  const router = useRouter();
  useEffect(() => {
    // TODO: Replace with real auth check (e.g., JWT, session)
    const isAuthenticated = Boolean(localStorage.getItem('authToken'));
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [router]);
}

export function useSubscriptionGuard() {
  const router = useRouter();
  useEffect(() => {
    // TODO: Replace with real subscription check
    const hasSubscription = Boolean(localStorage.getItem('subscribed'));
    if (!hasSubscription) {
      router.replace('/billing');
    }
  }, [router]);
}

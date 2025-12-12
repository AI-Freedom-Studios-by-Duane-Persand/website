import { useEffect } from 'react';
import { useRouter } from 'next/router';

export function useAdminGuard() {
  const router = useRouter();
  useEffect(() => {
    // TODO: Replace with real admin auth check
    const isAdmin = Boolean(localStorage.getItem('isAdmin'));
    if (!isAdmin) {
      router.replace('/login');
    }
  }, [router]);
}

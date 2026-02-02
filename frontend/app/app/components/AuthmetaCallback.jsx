// pages/auth/meta/callback.tsx (Next.js)
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function MetaCallback() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const { code, state } = router.query;

    const storedState = sessionStorage.getItem('meta_oauth_state');
    if (!code || !state || state !== storedState) {
      setError('Invalid OAuth callback state');
      return;
    }
  console.log('Authorization code:', process.env.NEXT_PUBLIC_META_APP_ID);
   
    fetch(`https://aifreedomstudios.com//api/meta/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
         
        appId: '1446935900283273',
        appSecret: 'e685e72595a48da1439a945424009f0b',
        redirectUri: `https://aifreedomstudios.com/auth/meta/callback`,
        code,
      }),
    })
      .then(res => res.json())
      .then(data => {
        console.log('Access token:', data);
       
        router.replace('/'); 
      })
      .catch(err => setError(err.message));
  }, [router]);

  if (error) return <div className="p-8 text-red-500">{error}</div>;
  return <div className="p-8">Connecting your Meta account...</div>;
}

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Package {
  _id: string;
  name: string;
  price: number;
  description?: string;
  features?: string[];
}

interface Subscription {
  _id: string;
  status: string;
  paymentLink?: string;
  validUntil?: string;
  packageId: Package;
}

export default function SubscriptionPanel() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/');
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    function getAuthHeaders() {
      if (typeof window === 'undefined') return {};
      const token = localStorage.getItem('token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    }
    Promise.all([
      fetch(`${apiUrl}/api/admin/packages`, { headers: getAuthHeaders() }).then(res => res.json()),
      fetch(`${apiUrl}/api/subscriptions/my`, { headers: getAuthHeaders() }).then(res => res.json()),
    ])
      .then(([pkgs, sub]) => {
        setPackages(pkgs);
        setSubscription(sub);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load subscription info");
        setLoading(false);
      });
  }, [router]);

  const handleSubscribe = async (packageId: string) => {
    setPaying(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const res = await fetch(`${apiUrl}/api/subscriptions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(typeof window !== 'undefined' && localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
      },
      body: JSON.stringify({ packageId }),
    });
    const data = await res.json();
    setPaying(false);
    if (data.paymentLink) {
      window.location.href = data.paymentLink;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Subscription</h2>
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : subscription && subscription.status === 'active' ? (
        <div className="text-center">
          <p className="mb-2">You are subscribed to <strong>{subscription.packageId?.name}</strong>.</p>
          <p>Status: <span className="font-semibold text-green-600">Active</span></p>
          <p>Valid Until: {subscription.validUntil ? new Date(subscription.validUntil).toLocaleDateString() : '-'}</p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-center">No active subscription. Choose a package:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {packages.map(pkg => (
              <div key={pkg._id} className="border rounded-lg p-4 flex flex-col items-center">
                <div className="text-xl font-bold mb-2">{pkg.name}</div>
                <div className="text-2xl font-extrabold mb-2">${pkg.price}</div>
                <div className="mb-2 text-gray-600">{pkg.description}</div>
                <ul className="mb-2 text-sm text-gray-500">
                  {pkg.features?.map((f, i) => <li key={i}>• {f}</li>)}
                </ul>
                <button
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  onClick={() => handleSubscribe(pkg._id)}
                  disabled={paying}
                >
                  {paying ? 'Redirecting...' : 'Subscribe'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

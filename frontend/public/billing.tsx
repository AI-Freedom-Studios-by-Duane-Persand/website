// Billing page (Stripe checkout)
import React from 'react';

export default function Billing() {
  const handleCheckout = async () => {
    // Call backend to create Stripe checkout session
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const res = await fetch(`${apiUrl}/api/billing/checkout`, { method: 'POST' });
    const { url } = await res.json();
    window.location.href = url;
  };

  return (
    <div>
      <h1>Billing</h1>
      <button onClick={handleCheckout}>Subscribe / Pay</button>
    </div>
  );
}

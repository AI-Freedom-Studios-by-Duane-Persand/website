// frontend/app/pricing/page.tsx
"use client";
export default function PricingPage() {
  const plans = [
    { id: "basic", name: "Basic", price: 29, features: ["Up to 3 campaigns", "Asset uploads", "Basic scheduling"] },
    { id: "pro", name: "Pro", price: 99, features: ["Unlimited campaigns", "Advanced scheduling", "Priority support"] },
  ];

  async function handleCheckout(planId: string) {
    // Call backend to create Stripe checkout session
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const res = await fetch(`${apiUrl}/api/billing/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    });
    if (!res.ok) return alert("Failed to start checkout");
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <main>
      <h2>Pricing</h2>
      <div style={{ display: "flex", gap: "2rem" }}>
        {plans.map(plan => (
          <div key={plan.id} style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}>
            <h3>{plan.name}</h3>
            <p style={{ fontSize: "2rem" }}>${plan.price}/mo</p>
            <ul>
              {plan.features.map(f => <li key={f}>{f}</li>)}
            </ul>
            <button onClick={() => handleCheckout(plan.id)}>Subscribe</button>
          </div>
        ))}
      </div>
    </main>
  );
}

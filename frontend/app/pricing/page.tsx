// frontend/app/pricing/page.tsx
"use client";
import { billingApi } from "@/lib/api/billing.api";
import { parseApiError, getUserMessage } from "@/lib/error-handler";
export default function PricingPage() {
  const plans = [
    { id: "basic", name: "Basic", price: 29, features: ["Up to 3 campaigns", "Asset uploads", "Basic scheduling"] },
    { id: "pro", name: "Pro", price: 99, features: ["Unlimited campaigns", "Advanced scheduling", "Priority support"] },
  ];

  async function handleCheckout(planId: string) {
    try {
      const { url } = await billingApi.createCheckoutSession(planId);
      window.location.href = url;
    } catch (err) {
      const parsed = parseApiError(err);
      alert(getUserMessage(parsed));
    }
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

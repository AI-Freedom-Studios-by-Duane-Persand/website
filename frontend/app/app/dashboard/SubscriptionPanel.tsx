"use client";

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

function buildAuthHeaders(extra?: Record<string, string>) {
  const headers = new Headers(extra);

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  return headers; // Headers is valid HeadersInit
}

export default function SubscriptionPanel() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

    Promise.all([
      fetch(`${apiUrl}/api/admin/packages`, { headers: buildAuthHeaders() }).then((res) => res.json()),
      fetch(`${apiUrl}/api/subscriptions/my`, { headers: buildAuthHeaders() }).then((res) => res.json()),
    ])
      .then(([pkgs, sub]) => {
        setPackages(Array.isArray(pkgs) ? pkgs : []);
        setSubscription(sub && sub._id ? sub : null);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load subscription info");
        setLoading(false);
      });
  }, [router]);

  const handleSubscribe = async (packageId: string) => {
    setPayingId(packageId);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

    const res = await fetch(`${apiUrl}/api/subscriptions/create`, {
      method: "POST",
      headers: buildAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ packageId }),
    });

    const data = await res.json();
    setPayingId(null);

    if (data?.paymentLink) window.location.href = data.paymentLink;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 md:p-8 bg-white rounded-2xl shadow mt-8 border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Subscription</h2>
        {subscription?.status === "active" ? (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
            <span className="h-2 w-2 rounded-full bg-green-600" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200">
            <span className="h-2 w-2 rounded-full bg-gray-500" />
            Not Subscribed
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading...</div>
      ) : error ? (
        <div className="text-red-600 text-center py-10">{error}</div>
      ) : subscription && subscription.status === "active" ? (
        <div className="rounded-xl border border-gray-200 p-5 bg-gray-50">
          <p className="text-gray-700">
            You are subscribed to{" "}
            <span className="font-semibold text-gray-900">{subscription.packageId?.name}</span>.
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Valid until:{" "}
            <span className="font-medium text-gray-900">
              {subscription.validUntil ? new Date(subscription.validUntil).toLocaleDateString() : "-"}
            </span>
          </p>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-4">No active subscription. Choose a package:</p>

          <div className="space-y-4">
            {packages.map((pkg) => {
              const isPaying = payingId === pkg._id;

              return (
                <div
                  key={pkg._id}
                  className="rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition bg-white"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{pkg.name}</h3>
                        {pkg.description ? <span className="hidden md:inline text-sm text-gray-500">•</span> : null}
                        {pkg.description ? (
                          <p className="hidden md:block text-sm text-gray-600 truncate">{pkg.description}</p>
                        ) : null}
                      </div>

                      {pkg.description ? (
                        <p className="md:hidden text-sm text-gray-600 mt-1">{pkg.description}</p>
                      ) : null}

                      {pkg.features?.length ? (
                        <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                          {pkg.features.map((f, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
                              <span className="leading-6">{f}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    <div className="flex md:flex-col md:items-end gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Price</div>
                        <div className="text-2xl font-bold text-gray-900">${pkg.price}</div>
                      </div>

                      <button
                        className="h-11 px-5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                        onClick={() => handleSubscribe(pkg._id)}
                        disabled={!!payingId}
                      >
                        {isPaying ? "Redirecting..." : "Subscribe"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!packages.length ? <div className="text-center text-gray-500 py-10">No packages available.</div> : null}
        </>
      )}
    </div>
  );
}

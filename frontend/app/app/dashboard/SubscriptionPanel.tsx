"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { subscriptionsApi, type PackageDto, type SubscriptionDto } from "@/lib/api/subscriptions.api";
import { parseApiError, getUserMessage } from "@/lib/error-handler";

export default function SubscriptionPanel() {
  const router = useRouter();
  const [packages, setPackages] = useState<PackageDto[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    const token = apiClient.parseToken();
    if (!token) {
      router.push("/");
      return;
    }

    const load = async () => {
      try {
        const [pkgs, sub] = await Promise.all([
          subscriptionsApi.listPackages(),
          subscriptionsApi.getCurrentSubscription(),
        ]);

        setPackages(Array.isArray(pkgs) ? pkgs : []);
        setSubscription(sub && (sub as SubscriptionDto)._id ? (sub as SubscriptionDto) : null);
      } catch (err) {
        const parsed = parseApiError(err);
        setError(getUserMessage(parsed));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router]);

  const handleSubscribe = async (packageId: string) => {
    setPayingId(packageId);
    try {
      const data = await subscriptionsApi.create(packageId);
      const paymentLink = (data as any)?.paymentLink || (data as any)?.url;
      if (paymentLink) {
        window.location.href = paymentLink;
      } else {
        setSubscription(data as SubscriptionDto);
      }
    } catch (err) {
      const parsed = parseApiError(err);
      setError(getUserMessage(parsed));
    } finally {
      setPayingId(null);
    }
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
            <span className="font-semibold text-gray-900">
              {typeof subscription.packageId === "object"
                ? subscription.packageId?.name
                : subscription.package?.name || "Current plan"}
            </span>.
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
              const packageId = pkg._id;

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
                        onClick={() => packageId && handleSubscribe(packageId)}
                        disabled={!!payingId || !packageId}
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

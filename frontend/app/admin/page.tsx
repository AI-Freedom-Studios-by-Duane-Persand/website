// frontend/app/admin/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseJwt } from "../../lib/parseJwt";
import PackageManagementPanel from "./PackageManagementPanel";

// (Kept for future use if you want to surface links on this page)
const SIDEBAR_LINKS = [
  { href: "/admin/tenants", label: "Tenants", icon: "🏢" },
  { href: "/admin/branding", label: "Branding", icon: "🎨" },
  { href: "/admin/integrations", label: "Integrations", icon: "🔌" },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: "💳" },
];

// Fetch summary metrics from backend API
async function fetchAdminSummary() {
  try {
    let token: string | null = null;

    if (typeof document !== "undefined") {
      const matchAuth = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
      const matchAccess = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
      if (matchAuth) token = matchAuth[1];
      else if (matchAccess) token = matchAccess[1];
    }
    if (!token && typeof window !== "undefined") {
      token = localStorage.getItem("token");
    }

    console.log("[fetchAdminSummary] JWT token:", token);

    const res = await fetch("http://localhost:3001/api/admin/summary", {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Failed to fetch summary");
    return await res.json();
  } catch (err) {
    return null;
  }
}

export default function AdminHomePage() {
  const router = useRouter();
  const [summary, setSummary] = useState<any | null>(null);

  useEffect(() => {
    let token: string | null = null;

    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
      if (match) token = match[1];
    }
    if (!token && typeof window !== "undefined") {
      token = localStorage.getItem("token");
    }

    let isAdmin = false;
    if (token) {
      const payload = parseJwt(token);
      if (payload) {
        const roles = Array.isArray(payload.roles)
          ? payload.roles
          : [payload.role];
        if (roles.includes("superadmin") || roles.includes("admin")) {
          isAdmin = true;
        }
      }
    }

    if (!isAdmin) {
      router.push("/login");
      return;
    }

    fetchAdminSummary()
      .then((data) => setSummary(data))
      .catch(() => {});
  }, [router]);

  return (
    <main
      className="
        min-h-screen
        bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#020617]
        pt-16 pb-12 px-4
      "
    >
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <header className="text-center text-white">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ef4444] via-[#f97316] to-[#2563eb] shadow-xl mb-3">
            <span className="font-extrabold text-lg">ADM</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-300">
            Manage tenants, branding, integrations, and subscriptions for{" "}
            <span className="font-semibold">@aifreedomduane</span>.
          </p>
        </header>

        {/* Summary section */}
        <section className="rounded-2xl border border-slate-800 bg-slate-950/70 shadow-2xl p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg md:text-xl font-semibold">
                Summary Snapshot
              </h3>
              <p className="text-sm text-slate-400">
                High-level metrics across the platform.
              </p>
            </div>
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 text-slate-200 border border-slate-700">
              Super Admin View
            </span>
          </div>

          {!summary ? (
            <div className="text-center text-slate-500 py-8 text-sm">
              Loading summary…
            </div>
          ) : (
            <>
              {/* Raw JSON (debug) */}
              <details className="mb-6">
                <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-200">
                  Raw summary JSON (debug)
                </summary>
                <pre className="mt-2 bg-black/60 text-slate-100 text-[11px] md:text-xs p-3 rounded-lg overflow-x-auto border border-slate-800">
                  {JSON.stringify(summary, null, 2)}
                </pre>
              </details>

              {/* Metric cards */}
              <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-4">
                <SummaryCard
                  label="Tenants"
                  value={summary.tenants}
                  accent="from-blue-500 to-sky-400"
                />
                <SummaryCard
                  label="Users"
                  value={summary.users}
                  accent="from-emerald-500 to-teal-400"
                />
                <SummaryCard
                  label="Campaigns"
                  value={summary.campaigns}
                  accent="from-amber-400 to-orange-400"
                />
                <SummaryCard
                  label="Creatives"
                  value={summary.creatives}
                  accent="from-violet-400 to-purple-400"
                />
                <SummaryCard
                  label="Assets Uploaded"
                  value={summary.assetsUploaded}
                  accent="from-rose-400 to-pink-400"
                />
                <SummaryCard
                  label="Engines Run"
                  value={summary.enginesRun}
                  accent="from-indigo-400 to-sky-400"
                />
                <SummaryCard
                  label="Active Subs"
                  value={summary.activeSubscriptions}
                  accent="from-teal-400 to-emerald-400"
                />
                <SummaryCard
                  label="Total Revenue"
                  value={
                    typeof summary.totalRevenue === "number"
                      ? summary.totalRevenue.toLocaleString()
                      : "—"
                  }
                  accent="from-slate-400 to-slate-200"
                />
              </div>
            </>
          )}
        </section>

        {/* Package management */}
        <section className="rounded-2xl border border-slate-800 bg-slate-950/70 shadow-2xl p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg md:text-xl font-semibold">
                Packages &amp; Plans
              </h3>
              <p className="text-sm text-slate-400">
                Configure subscription packages, limits, and feature tiers.
              </p>
            </div>
          </div>
          <PackageManagementPanel />
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="rounded-xl bg-slate-900/70 border border-slate-800 shadow-lg p-4 flex flex-col items-center justify-center">
      <div
        className={`
          mb-2 inline-flex items-center justify-center rounded-full px-2.5 py-1
          text-[11px] font-semibold tracking-wide uppercase
          bg-gradient-to-r ${accent} text-slate-950
        `}
      >
        {label}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}


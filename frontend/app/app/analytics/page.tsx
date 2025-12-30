// frontend/app/app/analytics/page.tsx
"use client";
import EarlyAccessGate from "../../components/EarlyAccessGate";
import SubscriptionGate from "../../components/SubscriptionGate";
import { useAuth } from "../../hooks/useAuth";

export default function AnalyticsPage() {
  const { hasEarlyAccess } = useAuth();
  // TODO: Replace with API call to fetch real analytics data
  const analytics = {
    campaigns: 18,
    creatives: 73,
    totalRevenue: 2999.99,
    engagementRate: 0.08,
    posts: 42,
    followers: 1200,
    enginesRun: 34,
    assetsUploaded: 120,
    monthlyRevenue: [
      { month: "Jan", revenue: 400 },
      { month: "Feb", revenue: 500 },
      { month: "Mar", revenue: 600 },
      { month: "Apr", revenue: 700 },
      { month: "May", revenue: 799.99 },
    ],
  };

  const maxRevenue = Math.max(...analytics.monthlyRevenue.map((m) => m.revenue), 1);

  const cards = [
    { label: "Campaigns", value: analytics.campaigns, chip: "Platform" },
    { label: "Creatives", value: analytics.creatives, chip: "Assets" },
    { label: "Assets Uploaded", value: analytics.assetsUploaded, chip: "Storage" },
    { label: "Engines Run", value: analytics.enginesRun, chip: "Automation" },
    { label: "Posts", value: analytics.posts, chip: "Publishing" },
    { label: "Followers", value: analytics.followers, chip: "Growth" },
    { label: "Engagement Rate", value: `${(analytics.engagementRate * 100).toFixed(2)}%`, chip: "Performance" },
    { label: "Total Revenue", value: `$${analytics.totalRevenue.toLocaleString()}`, chip: "Revenue" },
  ];

  return (
    <EarlyAccessGate hasAccess={hasEarlyAccess}>
      <SubscriptionGate>
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#020617] pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-white">
          <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Analytics</h1>
              <p className="mt-1 text-sm text-slate-300">
                Key performance metrics across campaigns, creatives, and revenue.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb]" />
              Live (demo data)
            </div>
          </div>
        </header>

        {/* Key Metrics */}
        <section className="bg-white/95 rounded-2xl shadow-xl border border-slate-200">
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-slate-900">Key Metrics</h2>
                <p className="mt-1 text-sm text-slate-500">A quick snapshot of your account performance.</p>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600">
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-slate-200 bg-white">
                  Updated: <span className="ml-1 font-semibold">Now</span>
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {cards.map((c) => (
                <div
                  key={c.label}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-semibold text-slate-600">{c.label}</div>
                      <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border border-slate-200 bg-slate-50 text-slate-700">
                        {c.chip}
                      </span>
                    </div>

                    <div className="mt-2 text-2xl md:text-3xl font-extrabold text-slate-900">
                      {c.value}
                    </div>

                    <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Monthly Revenue */}
        <section className="bg-white/95 rounded-2xl shadow-xl border border-slate-200">
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-slate-900">Monthly Revenue</h2>
                <p className="mt-1 text-sm text-slate-500">Visual trend of revenue over the last months.</p>
              </div>

              <div className="text-xs text-slate-600 rounded-full border border-slate-200 bg-white px-3 py-1">
                Peak:{" "}
                <span className="font-semibold">
                  ${maxRevenue.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-end gap-3 sm:gap-4 h-48">
                {analytics.monthlyRevenue.map((item) => {
                  const pct = Math.max(6, Math.round((item.revenue / maxRevenue) * 100));
                  return (
                    <div key={item.month} className="flex-1 min-w-[44px] text-center">
                      <div className="h-36 sm:h-40 flex items-end justify-center">
                        <div
                          className="w-8 sm:w-10 rounded-xl shadow-sm bg-gradient-to-b from-[#2563eb] via-[#f97316] to-[#ef4444]"
                          style={{ height: `${pct}%` }}
                          title={`$${item.revenue}`}
                        />
                      </div>

                      <div className="mt-2 text-xs font-semibold text-slate-900">{item.month}</div>
                      <div className="text-[11px] text-slate-600">${item.revenue}</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
      </SubscriptionGate>
    </EarlyAccessGate>
  );
}

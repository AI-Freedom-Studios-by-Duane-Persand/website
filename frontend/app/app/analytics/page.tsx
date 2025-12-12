// frontend/app/app/analytics/page.tsx
export default function AnalyticsPage() {
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
      { month: 'Jan', revenue: 400 },
      { month: 'Feb', revenue: 500 },
      { month: 'Mar', revenue: 600 },
      { month: 'Apr', revenue: 700 },
      { month: 'May', revenue: 799.99 },
    ],
  };

  return (
    <main>
      <h2>Analytics</h2>
      <section style={{ marginTop: 24 }}>
        <h3>Key Metrics</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ minWidth: 180 }}>
            <strong>Campaigns:</strong> {analytics.campaigns}
          </div>
          <div style={{ minWidth: 180 }}>
            <strong>Creatives:</strong> {analytics.creatives}
          </div>
          <div style={{ minWidth: 180 }}>
            <strong>Assets Uploaded:</strong> {analytics.assetsUploaded}
          </div>
          <div style={{ minWidth: 180 }}>
            <strong>Engines Run:</strong> {analytics.enginesRun}
          </div>
          <div style={{ minWidth: 180 }}>
            <strong>Posts:</strong> {analytics.posts}
          </div>
          <div style={{ minWidth: 180 }}>
            <strong>Followers:</strong> {analytics.followers}
          </div>
          <div style={{ minWidth: 180 }}>
            <strong>Engagement Rate:</strong> {(analytics.engagementRate * 100).toFixed(2)}%
          </div>
          <div style={{ minWidth: 180 }}>
            <strong>Total Revenue:</strong> ${analytics.totalRevenue.toLocaleString()}
          </div>
        </div>
      </section>
      <section style={{ marginTop: 32 }}>
        <h3>Monthly Revenue</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', height: 120 }}>
          {analytics.monthlyRevenue.map((item) => (
            <div key={item.month} style={{ textAlign: 'center' }}>
              <div
                style={{
                  background: '#4f46e5',
                  width: 32,
                  height: `${item.revenue / 8}px`,
                  borderRadius: 4,
                  marginBottom: 8,
                }}
              ></div>
              <div style={{ fontWeight: 600 }}>{item.month}</div>
              <div style={{ fontSize: 12 }}>${item.revenue}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

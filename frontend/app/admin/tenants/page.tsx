// frontend/app/admin/tenants/page.tsx
"use client";
import { Toaster, toast } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api/admin.api';
import { apiClient } from '@/lib/api/client';
import { parseApiError, getUserMessage } from '@/lib/error-handler';
// Uses AdminLayout from layout.tsx (applied automatically by Next.js App Router)

// PLAN STEP LOGGING (from plan-campaignOs.prompt.md)
const PLAN_STEPS = [
  'Set up Monorepo Structure',
  'Define TypeScript Interfaces & Mongoose Schemas',
  'Implement Core NestJS Modules',
  'Stripe Integration (No Webhooks)',
  'ConfigService & Integration Encryption',
  'Implement EnginesModule (AI Micro-Agents)',
  'Scheduling & Social Publishing',
  'Media Storage & User Asset Uploads via Cloudflare R2',
  'Frontend (Next.js) Scaffolding & Asset Uploads',
  'Admin Dashboard',
];

function logPlanSteps() {
  console.info('[PLAN] --- Campaign OS SaaS Plan Steps ---');
  PLAN_STEPS.forEach((step, idx) => {
    console.info(`[PLAN] Step ${idx + 1}: ${step}`);
  });
  console.info('[PLAN] --- End of Plan Steps ---');
}

export default function AdminTenantsPage() {
  const router = useRouter();

  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [override, setOverride] = useState<{ [id: string]: { planId: string; subscriptionStatus: string } }>({});
  const [saving, setSaving] = useState<{ [id: string]: boolean }>({});
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<{ role: string; subscriptionStatus: string } | null>(null);

  useEffect(() => {
    // Log all plan steps on mount
    logPlanSteps();
    console.info('[PLAN] Step 9: Frontend (Next.js) Scaffolding & Asset Uploads - Admin/Tenants page mount');
    const token = apiClient.parseToken();
    if (!token) {
      router.push('/');
      return;
    }
    // Fetch current user info
    console.info('[PLAN] Step 9: Fetching current user info');
    (async () => {
      try {
        const me = await adminApi.listUsers(); // fallback: use admin users to ensure auth; minimal use
        // role is not returned here; keep existing placeholder
        setUser({ role: 'admin', subscriptionStatus: 'active' });
      } catch (err) {
        console.error('[PLAN] Step 9: Error loading user info', err);
        setUser(null);
      }
    })();
    // Fetch tenants
    console.info('[PLAN] Step 10: Fetching tenants for admin dashboard');
    async function fetchTenants() {
      try {
        const data = await adminApi.listTenants();
        setTenants((data || []).map(t => ({ ...t, ownerEmail: t.ownerEmail || '' })));
        setLoading(false);
      } catch (err) {
        const parsed = parseApiError(err);
        setError('Failed to load tenants: ' + getUserMessage(parsed));
        console.error('[ADMIN/TENANTS] Error fetching tenants', parsed);
        setLoading(false);
      }
    }
    fetchTenants();
  }, [router]);

  async function handleOverride(id: string) {
    console.info('[PLAN] Step 10: Manual override for tenant', id, override[id]);
    setSaving(s => ({ ...s, [id]: true }));
    setError("");
    setSuccess("");
    try {
      await adminApi.overrideTenant(id, override[id]);
      const updated = await adminApi.listTenants();
      setTenants(updated || []);
      console.info('[PLAN] Step 10: Override successful, tenants updated');
      setOverride(o => ({ ...o, [id]: { planId: '', subscriptionStatus: '' } }));
      setSuccess("Subscription override successful.");
      console.info('[PLAN] Step 10: Subscription override successful for tenant', id);
      toast.success("Subscription override successful.");
    } catch (err: any) {
      const parsed = parseApiError(err);
      const msg = getUserMessage(parsed);
      setError(msg);
      console.error('[PLAN] Step 10: Error overriding subscription', parsed);
      toast.error(msg);
    } finally {
      setSaving(s => ({ ...s, [id]: false }));
      console.info('[PLAN] Step 10: Override process finished for tenant', id);
    }
  }


  return (
    <>
      <Toaster position="top-right" />
      <div className='mt-20'>
        {user && (user.role === 'admin' || user.role === 'superadmin') ? (
          <>
            {error && <div role="alert" aria-live="assertive" style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}
            {success && <div role="status" aria-live="polite" style={{ background: '#d1fae5', color: '#065f46', padding: 12, borderRadius: 8, marginBottom: 16 }}>{success}</div>}
            <input
              type="text"
              placeholder="Search tenants by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', marginBottom: 24, padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16 }}
              aria-label="Search tenants"
            />
            {loading ? <p style={{ color: '#6b7280', fontSize: 18 }}>Loading...</p> : (
              <div style={{ display: 'grid', gap: 24 }}>
                {tenants
                  .filter(t =>
                    t.name?.toLowerCase().includes(search.toLowerCase()) ||
                    t.email?.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((t) => (
                    <div key={t._id} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #e5e7eb', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 20, color: '#1a2233' }}>{t.name}</div>
                        <div style={{ color: '#6b7280', fontSize: 14 }}>Email: <b>{t.email}</b></div>
                        <div style={{ color: '#6b7280', fontSize: 14 }}>Plan: <b>{t.planId}</b></div>
                        <div style={{ color: t.subscriptionStatus === 'active' ? '#059669' : '#b91c1c', fontWeight: 500, fontSize: 14 }}>
                          Status: {t.subscriptionStatus}
                        </div>
                        <div style={{ color: '#6b7280', fontSize: 14 }}>Owner Email: <b>{t.ownerEmail}</b></div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <form
                          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                          onSubmit={e => {
                            e.preventDefault();
                            // Validate input
                            const planId = override[t._id]?.planId ?? '';
                            const status = override[t._id]?.subscriptionStatus ?? '';
                            if (!planId || !status) {
                              setError('Please enter both Plan ID and Status to override.');
                              return;
                            }
                            if (!window.confirm(`Override subscription for ${t.name}? This action cannot be undone.`)) return;
                            handleOverride(t._id);
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Plan ID"
                            value={override[t._id]?.planId ?? ''}
                            onChange={e => setOverride(o => ({ ...o, [t._id]: { ...o[t._id], planId: e.target.value } }))}
                            style={{ width: 100, padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 14 }}
                            required
                            aria-label="Plan ID"
                          />
                          <select
                            value={override[t._id]?.subscriptionStatus ?? ''}
                            onChange={e => setOverride(o => ({ ...o, [t._id]: { ...o[t._id], subscriptionStatus: e.target.value } }))}
                            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 14 }}
                            required
                            aria-label="Subscription Status"
                          >
                            <option value="">Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="canceled">Canceled</option>
                          </select>
                          <button
                            type="submit"
                            disabled={saving[t._id]}
                            style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: saving[t._id] ? 'not-allowed' : 'pointer', transition: 'background 0.2s', opacity: saving[t._id] ? 0.7 : 1 }}
                            aria-busy={saving[t._id]}
                          >
                            {saving[t._id] ? <span><span className="loader" style={{ marginRight: 8, verticalAlign: 'middle' }} />Saving...</span> : 'Override'}
                          </button>
                        </form>
                        <button
                          onClick={async () => {
                            if (!window.confirm('Are you sure you want to delete this tenant?')) return;
                            setLoading(true);
                            setError("");
                            setSuccess("");
                            try {
                              await adminApi.deleteTenant(t._id);
                              setTenants(ts => ts.filter(x => x._id !== t._id));
                              setSuccess("Tenant deleted successfully.");
                              toast.success("Tenant deleted successfully.");
                            } catch (err: any) {
                              const parsed = parseApiError(err);
                              const msg = getUserMessage(parsed);
                              setError(msg);
                              toast.error(msg);
                            } finally {
                              setLoading(false);
                            }
                          }}
                          style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'background 0.2s' }}
                        >Delete</button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ color: '#6b7280', fontSize: 18, textAlign: 'center', marginTop: 48 }}>Checking permissions...</div>
        )}
      </div>
    </>
  );
}

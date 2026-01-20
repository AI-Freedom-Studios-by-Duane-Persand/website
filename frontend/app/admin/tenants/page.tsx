"use client";

import { Toaster, toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api/admin.api";
import { apiClient } from "@/lib/api/client";
import { parseApiError, getUserMessage } from "@/lib/error-handler";
import Loader from "@/components/Loader/Loader";

const PLAN_STEPS = [
  "Set up Monorepo Structure",
  "Define TypeScript Interfaces & Mongoose Schemas",
  "Implement Core NestJS Modules",
  "Stripe Integration (No Webhooks)",
  "ConfigService & Integration Encryption",
  "Implement EnginesModule (AI Micro-Agents)",
  "Scheduling & Social Publishing",
  "Media Storage & User Asset Uploads via Cloudflare R2",
  "Frontend (Next.js) Scaffolding & Asset Uploads",
  "Admin Dashboard",
];

function logPlanSteps() {
  console.info("[PLAN] --- Campaign OS SaaS Plan Steps ---");
  PLAN_STEPS.forEach((step, idx) => {
    console.info(`[PLAN] Step ${idx + 1}: ${step}`);
  });
  console.info("[PLAN] --- End of Plan Steps ---");
}


export default function AdminTenantsPage() {
  const router = useRouter();

  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [override, setOverride] = useState<{
    [id: string]: { planId: string; subscriptionStatus: string };
  }>({});

  const [saving, setSaving] = useState<{ [id: string]: boolean }>({});

  const [user, setUser] = useState<{
    role: string;
    subscriptionStatus: string;
  } | null>(null);

  /* ---------------------------------------------------------
     EFFECT: AUTH + FETCH
  --------------------------------------------------------- */
  useEffect(() => {
    logPlanSteps();
    console.info("[PLAN] Step 9: Admin/Tenants page mount");

    const token = apiClient.parseToken();
    if (!token) {
      router.push("/");
      return;
    }

    // Placeholder admin auth (kept intentionally)
    (async () => {
      try {
        await adminApi.listUsers();
        setUser({ role: "admin", subscriptionStatus: "active" });
      } catch {
        setUser(null);
      }
    })();

    async function fetchTenants() {
      try {
        const data = await adminApi.listTenants();
        setTenants((data || []).map(t => ({ ...t, ownerEmail: t.ownerEmail || "" })));
      } catch (err) {
        const parsed = parseApiError(err);
        setError("Failed to load tenants: " + getUserMessage(parsed));
      } finally {
        setLoading(false);
      }
    }

    fetchTenants();
  }, [router]);


  async function handleOverride(id: string) {
    setSaving(s => ({ ...s, [id]: true }));
    setError("");
    setSuccess("");

    try {
      await adminApi.overrideTenant(id, override[id]);
      const updated = await adminApi.listTenants();
      setTenants(updated || []);
      setOverride(o => ({ ...o, [id]: { planId: "", subscriptionStatus: "" } }));
      setSuccess("Subscription override successful.");
      toast.success("Subscription override successful.");
    } catch (err) {
      const parsed = parseApiError(err);
      const msg = getUserMessage(parsed);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(s => ({ ...s, [id]: false }));
    }
  }

  return (
    <>
      <Toaster position="top-right" />

      <div className="mt-20 max-w-7xl mx-auto px-4">
        {user && (user.role === "admin" || user.role === "superadmin") ? (
          <div className="rounded-2xl bg-white/20 backdrop-blur border border-slate-600/10 shadow-xl p-6">

            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-slate-600">
                Tenants
              </h1>
              <p className="text-sm text-slate-500">
                Manage tenants, subscriptions, and access
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 text-red-400 px-4 py-3">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-lg bg-emerald-500/10 text-emerald-400 px-4 py-3">
                {success}
              </div>
            )}

            {/* Search */}
            <input
              type="text"
              placeholder="Search tenants by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="
                w-full mb-6 px-4 py-2
                rounded-lg
                bg-white/60
                text-slate-500
                placeholder:text-slate-400
                border border-slate-600/10
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            />

            {/* Content */}
            {loading ? (
             <p className=""></p>
            ) : (
              <div className="space-y-4">
                {tenants
                  .filter(t =>
                    t.name?.toLowerCase().includes(search.toLowerCase()) ||
                    t.email?.toLowerCase().includes(search.toLowerCase())
                  )
                  .map(t => (
                    <div
                      key={t._id}
                      className="
                        rounded-xl
                        bg-white/40
                        border border-slate-600/10
                        p-5
                        flex items-center justify-between
                        hover:bg-white/60 transition
                      "
                    >
                      {/* Left */}
                      <div className="space-y-1">
                        <div className="text-lg font-semibold text-slate-600">
                          {t.name}
                        </div>
                        {/* This data is not available currently. */}
                        {/* <div className="text-sm text-slate-400">
                          Email: <b>{t.email}</b>
                        </div>
                        <div className="text-sm text-slate-400">
                          Plan: <b>{t.planId}</b>
                        </div> */}
                        <div className="text-sm text-slate-500">
                          Owner: <b>{t.ownerEmail}</b>
                        </div>
                         <div className="text-sm text-slate-500">
                          Status: <b><span
                          className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium
                            ${t.subscriptionStatus === "active"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                            }`}
                        >
                          {t.subscriptionStatus}
                        </span></b>
                        </div>
                        
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <form
                          className="flex items-center gap-2"
                          onSubmit={e => {
                            e.preventDefault();
                            const planId = override[t._id]?.planId ?? "";
                            const status = override[t._id]?.subscriptionStatus ?? "";
                            if (!planId || !status) {
                              setError("Please enter both Plan ID and Status.");
                              return;
                            }
                            if (!window.confirm(`Override subscription for ${t.name}?`)) return;
                            handleOverride(t._id);
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Plan ID"
                            value={override[t._id]?.planId ?? ""}
                            onChange={e =>
                              setOverride(o => ({
                                ...o,
                                [t._id]: { ...o[t._id], planId: e.target.value },
                              }))
                            }
                            className="
                              w-28 px-3 py-1.5 rounded-md
                              bg-white/40 text-slate-600
                              border border-slate-600/10
                              focus:outline-none focus:ring-1 focus:ring-blue-500
                            "
                          />

                          <select
                            value={override[t._id]?.subscriptionStatus ?? ""}
                            onChange={e =>
                              setOverride(o => ({
                                ...o,
                                [t._id]: { ...o[t._id], subscriptionStatus: e.target.value },
                              }))
                            }
                            className="
                              px-3 py-1.5 rounded-md
                              bg-white/40 text-slate-600
                              border border-slate-600
                              focus:outline-none focus:ring-1 focus:ring-blue-500
                            "
                          >
                            <option value="">Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="canceled">Canceled</option>
                          </select>

                          <button
                            type="submit"
                            disabled={saving[t._id]}
                            className="
                              px-4 py-2 rounded-md
                              bg-blue-600 hover:bg-blue-500
                              text-white text-sm font-medium
                              transition disabled:opacity-50
                            "
                          >
                            {saving[t._id] ? "Saving…" : "Override"}
                          </button>
                        </form>

                        <button
                          onClick={async () => {
                            if (!window.confirm("Delete this tenant?")) return;
                            setLoading(true);
                            try {
                              await adminApi.deleteTenant(t._id);
                              setTenants(ts => ts.filter(x => x._id !== t._id));
                              toast.success("Tenant deleted");
                            } catch (err) {
                              const parsed = parseApiError(err);
                              toast.error(getUserMessage(parsed));
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className="
                            px-4 py-2 rounded-md
                            bg-red-600/90 hover:bg-red-600
                            text-white text-sm font-medium
                            transition
                          "
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-slate-400 mt-20">
            Checking permissions…
          </p>
        )}
      </div>
    </>
  );
}

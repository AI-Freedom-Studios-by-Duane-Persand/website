// frontend/app/admin/tenants/page.tsx
"use client";
import { Toaster, toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// PLAN STEP LOGGING (from plan-campaignOs.prompt.md)
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

function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminTenantsPage() {
  const router = useRouter();

  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [override, setOverride] = useState<{
    [id: string]: { planId: string; subscriptionStatus: string; renewal?: string };
  }>({});
  const [plans, setPlans] = useState<{ _id: string; name: string }[]>([]);
  const [saving, setSaving] = useState<{ [id: string]: boolean }>({});
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<{ role?: string; roles?: string[]; subscriptionStatus?: string } | null>(null);

  useEffect(() => {
    // Log all plan steps on mount
    logPlanSteps();
    console.info(
      "[PLAN] Step 9: Frontend (Next.js) Scaffolding & Asset Uploads - Admin/Tenants page mount"
    );
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/");
      return;
    }
    // Fetch current user info
    console.info("[PLAN] Step 9: Fetching current user info");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${apiUrl}/api/auth/me`, {
      credentials: "include",
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        console.info("[PLAN] Step 9: User info loaded", data);
        setUser({
          role: data.role,
          roles: data.roles,
          subscriptionStatus: data.subscriptionStatus,
        });
      })
      .catch((err) => {
        console.error("[PLAN] Step 9: Error loading user info", err);
        setUser(null);
      });
    // Fetch tenants
    console.info("[PLAN] Step 10: Fetching tenants for admin dashboard");
    fetch(`${apiUrl}/api/admin/tenants`, {
      credentials: "include",
      headers: getAuthHeaders(),
    })
      .then(async (res) => {
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = text;
        }
        console.info("[PLAN] Step 10: /api/admin/tenants response", data);
        if (!res.ok) {
          setError(`Failed to load tenants: ${data?.message || res.status}`);
          console.error("[PLAN] Step 10: Failed to load tenants", data);
          setLoading(false);
          return;
        }
        setTenants(data);
        console.info("[PLAN] Step 10: Tenants loaded", data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load tenants: " + (err?.message || err));
        console.error("[PLAN] Step 10: Error fetching tenants", err);
        setLoading(false);
        console.error("[ADMIN/TENANTS] Error fetching tenants:", err);
      });
    // Fetch plans for dropdown
    fetch(`${apiUrl}/api/admin/plans`, {
      credentials: "include",
      headers: getAuthHeaders(),
    })
      .then(async (res) => {
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = text;
        }
        if (!res.ok) {
          console.error("[PLAN] Step 10: Failed to load plans", data);
          return;
        }
        setPlans(data);
        console.info("[PLAN] Step 10: Plans loaded", data);
      })
      .catch((err) => {
        console.error("[PLAN] Step 10: Error fetching plans", err);
      });
  }, [router]);

  async function handleOverride(id: string) {
    console.info("[PLAN] Step 10: Manual override for tenant", id, override[id]);
    setSaving((s) => ({ ...s, [id]: true }));
    setError("");
    setSuccess("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      // Prepare body to match backend: { plan, status, renewal }
      const plan = override[id]?.planId;
      const status = override[id]?.subscriptionStatus;
      const renewal = override[id]?.renewal ? new Date(override[id]?.renewal) : undefined;
      const body: any = { plan };
      if (status) body.status = status;
      if (renewal) body.renewal = renewal;
      const res = await fetch(`${apiUrl}/api/admin/subscription-override/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) {
        console.error("[PLAN] Step 10: Override failed for tenant", id);
        throw new Error("Failed to override");
      }
      // Refresh tenants
      const updated = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/admin/tenants`,
        {
          credentials: "include",
          headers: getAuthHeaders(),
        }
      ).then((r) => r.json());
      setTenants(updated);
      console.info("[PLAN] Step 10: Override successful, tenants updated");
      setOverride((o) => ({
        ...o,
        [id]: { planId: "", subscriptionStatus: "", renewal: "" },
      }));
      setSuccess("Subscription override successful.");
      console.info(
        "[PLAN] Step 10: Subscription override successful for tenant",
        id
      );
      toast.success("Subscription override successful.");
    } catch (err: any) {
      setError(err.message || "Error overriding subscription");
      console.error("[PLAN] Step 10: Error overriding subscription", err);
      toast.error(err.message || "Error overriding subscription");
    } finally {
      setSaving((s) => ({ ...s, [id]: false }));
      console.info(
        "[PLAN] Step 10: Override process finished for tenant",
        id
      );
    }
  }

  const filteredTenants = tenants.filter((t) =>
    (t.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (t.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-6">
        {/* Heading */}
        <header className="flex flex-col gap-1 mb-4 mt-20">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-50">
            Tenants & Subscriptions
          </h1>
          <p className="text-sm md:text-[15px] text-slate-400">
            View all tenants, inspect their plans, and apply manual overrides
            when needed.
          </p>
        </header>

        {/* Permission check */}
        {!user || !(
          (user.role === "admin" || user.role === "superadmin") ||
          (Array.isArray(user.roles) && (user.roles.includes("admin") || user.roles.includes("superadmin")))
        ) ? (
          <div className="mt-8 text-center text-slate-300 text-sm">
            Checking permissions…
          </div>
        ) : (
          <>
            {/* Alerts */}
            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}
            {success && (
              <div
                role="status"
                aria-live="polite"
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                {success}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search tenants by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search tenants"
                className="
                  w-full rounded-xl border border-slate-700/40 bg-slate-900/40
                  px-4 py-2.5 text-sm text-slate-50 placeholder:text-slate-500
                  focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-transparent
                "
              />
            </div>

            {/* Tenants list */}
            {loading ? (
              <p className="text-slate-400 text-sm mt-6">Loading tenants…</p>
            ) : filteredTenants.length === 0 ? (
              <p className="text-slate-400 text-sm mt-6">
                No tenants match your search.
              </p>
            ) : (
              <div className="mt-6 grid gap-4">
                {filteredTenants.map((t) => (
                  <div
                    key={t._id}
                    className="
                      flex flex-col md:flex-row md:items-start md:justify-between gap-4
                      rounded-2xl border border-slate-800 bg-slate-900/80
                      px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.35)]
                    "
                  >
                    {/* Tenant info */}
                    <div className="space-y-1">
                      <div className="text-base md:text-lg font-semibold text-slate-50">
                        {t.name || "Unnamed Tenant"}
                      </div>
                      <div className="text-xs md:text-sm text-slate-400">
                        Email: <span className="font-medium">{t.email}</span>
                      </div>
                      <div className="text-xs md:text-sm text-slate-400">
                        Plan:{" "}
                        <span className="font-medium">
                          {t.planId || "—"}
                        </span>
                      </div>
                      <div
                        className={`text-xs md:text-sm font-semibold ${
                          t.subscriptionStatus === "active"
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        Status: {t.subscriptionStatus || "unknown"}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <form
                        className="flex flex-wrap items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const planId = override[t._id]?.planId ?? "";
                          const status =
                            override[t._id]?.subscriptionStatus ?? "";
                          if (!planId || !status) {
                            setError(
                              "Please enter both Plan ID and Status to override."
                            );
                            return;
                          }
                          if (
                            !window.confirm(
                              `Override subscription for ${t.name}? This action cannot be undone.`
                            )
                          )
                            return;
                          handleOverride(t._id);
                        }}
                      >
                        <select
                          value={override[t._id]?.planId ?? ""}
                          onChange={(e) =>
                            setOverride((o) => ({
                              ...o,
                              [t._id]: {
                                ...o[t._id],
                                planId: e.target.value,
                              },
                            }))
                          }
                          required
                          aria-label="Plan ID"
                          className="
                            w-28 md:w-32 rounded-lg border border-slate-700 bg-slate-900
                            px-3 py-1.5 text-xs text-slate-50
                            focus:outline-none focus:ring-2 focus:ring-slate-500
                          "
                        >
                          <option value="">Plan</option>
                          {plans.map((plan) => (
                            <option key={plan._id} value={plan._id}>
                              {plan.name} ({plan._id})
                            </option>
                          ))}
                        </select>
                        <select
                          value={override[t._id]?.subscriptionStatus ?? ""}
                          onChange={(e) =>
                            setOverride((o) => ({
                              ...o,
                              [t._id]: {
                                ...o[t._id],
                                subscriptionStatus: e.target.value,
                              },
                            }))
                          }
                          required
                          aria-label="Subscription Status"
                          className="
                            rounded-lg border border-slate-700 bg-slate-900
                            px-3 py-1.5 text-xs text-slate-50
                            focus:outline-none focus:ring-2 focus:ring-slate-500
                          "
                        >
                          <option value="">Status</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="canceled">Canceled</option>
                        </select>
                        <input
                          type="date"
                          placeholder="Renewal Date"
                          value={override[t._id]?.renewal ?? ""}
                          onChange={(e) =>
                            setOverride((o) => ({
                              ...o,
                              [t._id]: {
                                ...o[t._id],
                                renewal: e.target.value,
                              },
                            }))
                          }
                          aria-label="Renewal Date"
                          className="
                            w-32 rounded-lg border border-slate-700 bg-slate-900
                            px-3 py-1.5 text-xs text-slate-50 placeholder:text-slate-500
                            focus:outline-none focus:ring-2 focus:ring-slate-500
                          "
                        />
                        <button
                          type="submit"
                          disabled={saving[t._id]}
                          aria-busy={saving[t._id]}
                          className="
                            inline-flex items-center justify-center rounded-lg
                            bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb]
                            px-4 py-1.5 text-xs font-semibold text-white
                            shadow-md hover:shadow-lg hover:opacity-95
                            disabled:opacity-70 disabled:cursor-not-allowed
                            transition
                          "
                        >
                          {saving[t._id] ? (
                            <span>
                              <span
                                className="loader mr-2 align-middle"
                                aria-hidden="true"
                              />
                              Saving…
                            </span>
                          ) : (
                            "Override"
                          )}
                        </button>
                      </form>

                      <button
                        onClick={async () => {
                          if (
                            !window.confirm(
                              "Are you sure you want to delete this tenant?"
                            )
                          )
                            return;
                          setLoading(true);
                          setError("");
                          setSuccess("");
                          try {
                            const apiUrl =
                              process.env.NEXT_PUBLIC_API_URL || "";
                            const res = await fetch(
                              `${apiUrl}/api/admin/tenants/${t._id}`,
                              {
                                method: "DELETE",
                                credentials: "include",
                                headers: getAuthHeaders(),
                              }
                            );
                            if (!res.ok) throw new Error("Failed to delete tenant");
                            setTenants((ts) => ts.filter((x) => x._id !== t._id));
                            setSuccess("Tenant deleted successfully.");
                            toast.success("Tenant deleted successfully.");
                          } catch (err: any) {
                            setError(err.message || "Error deleting tenant");
                            toast.error(err.message || "Error deleting tenant");
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="
                          inline-flex items-center justify-center rounded-lg
                          bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white
                          shadow-sm hover:bg-rose-700 transition
                        "
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

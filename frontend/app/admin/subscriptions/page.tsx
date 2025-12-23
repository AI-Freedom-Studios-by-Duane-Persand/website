"use client";
import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [creating, setCreating] = useState(false);
  const [newData, setNewData] = useState<any>({});
  const API_BASE = typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_BASE
    ? process.env.NEXT_PUBLIC_API_BASE
    : "/api";

  const [tenantOptions, setTenantOptions] = useState<{ label: string; value: string }[]>([]);
  const [planOptions, setPlanOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    // Fetch tenant and plan options for dropdowns
    fetch(`${API_BASE}/tenants/ids-names`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setTenantOptions(data.map((t: any) => ({ label: t.name, value: t.id }))))
      .catch(() => setTenantOptions([]));
    fetch(`${API_BASE}/admin/packages/ids-names`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setPlanOptions(data.map((p: any) => ({ label: p.name, value: p.id }))))
      .catch(() => setPlanOptions([]));
  }, [API_BASE]);
  useEffect(() => {
    fetch(`${API_BASE}/subscriptions`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setSubscriptions(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load subscriptions");
        setLoading(false);
      });
  }, []);

  function handleEdit(id: string) {
    setEditId(id);
    setEditData(subscriptions.find((s) => s._id === id));
  }

  async function handleUpdate() {
    if (!editId) return;
    try {
      const res = await fetch(`${API_BASE}/subscriptions/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update subscription");
      toast.success("Subscription updated");

      setEditId(null);
      setEditData({});

      const updated = await fetch(`${API_BASE}/subscriptions`, {
        credentials: "include",
      }).then((r) => r.json());
      setSubscriptions(updated);
    } catch (err: any) {
      toast.error(err.message || "Error updating subscription");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this subscription?")) return;
    try {
      const res = await fetch(`${API_BASE}/subscriptions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete subscription");
      toast.success("Subscription deleted");
      setSubscriptions(subscriptions.filter((s) => s._id !== id));
    } catch (err: any) {
      toast.error(err.message || "Error deleting subscription");
    }
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create subscription");

      toast.success("Subscription created");
      setNewData({});
      setCreating(false);

      const updated = await fetch("/api/subscriptions", {
        credentials: "include",
      }).then((r) => r.json());
      setSubscriptions(updated);
    } catch (err: any) {
      toast.error(err.message || "Error creating subscription");
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-black text-white px-6 py-12">
      <Toaster />

      {/* Header */}
      <header className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2563eb] via-[#f97316] to-[#ef4444] shadow-xl mb-3">
          <span className="font-extrabold text-xl">S</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold">Subscriptions</h1>
        <p className="text-slate-400 mt-2">Manage customer plans and billing history</p>
      </header>

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <p className="text-slate-400 text-center">Loading subscriptions…</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 shadow-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/50 text-slate-300 text-left">
                  <th className="p-3">Tenant</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Interval</th>
                  <th className="p-3">Start</th>
                  <th className="p-3">End</th>
                  <th className="p-3">Amount Paid</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr
                    key={sub._id}
                    className="border-t border-slate-800 hover:bg-slate-800/30 transition"
                  >
                    <td className="p-3">{sub.tenantId}</td>
                    <td className="p-3">{sub.planId}</td>
                    <td
                      className={`p-3 font-medium ${
                        sub.status === "active"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {sub.status}
                    </td>
                    <td className="p-3">{sub.billingInterval}</td>
                    <td className="p-3">
                      {sub.currentPeriodStart
                        ? new Date(sub.currentPeriodStart).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="p-3">
                      {sub.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="p-3">{sub.amountPaid}</td>
                    <td className="p-3 flex gap-3">
                      <button
                        onClick={() => handleEdit(sub._id)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(sub._id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Panel */}
        {editId && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Edit Subscription</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


              <InputField
                label="Plan ID"
                value={editData.planId || ""}
                onChange={(v) => setEditData({ ...editData, planId: v })}
                options={planOptions}
              />

              <InputField
                label="Tenant ID"
                value={editData.tenantId || ""}
                onChange={(v) => setEditData({ ...editData, tenantId: v })}
                options={tenantOptions}
              />

              <InputField
                label="Status"
                value={editData.status || ""}
                onChange={(v) => setEditData({ ...editData, status: v })}
                options={[
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                  { label: "Canceled", value: "canceled" },
                  { label: "Trialing", value: "trialing" },
                  { label: "Past Due", value: "past_due" },
                ]}
              />

              <InputField
                label="Billing Interval"
                value={editData.billingInterval || ""}
                onChange={(v) =>
                  setEditData({ ...editData, billingInterval: v })
                }
              />

              <InputField
                label="Amount Paid"
                type="number"
                value={editData.amountPaid || ""}
                onChange={(v) =>
                  setEditData({ ...editData, amountPaid: v })
                }
              />
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleUpdate}
                className="px-5 py-2 bg-blue-600 rounded-xl font-semibold hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditId(null)}
                className="px-5 py-2 bg-slate-700 rounded-xl font-semibold hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Create Panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Create Subscription</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


            <InputField
              label="Tenant ID"
              value={newData.tenantId || ""}
              onChange={(v) => setNewData({ ...newData, tenantId: v })}
              options={tenantOptions}
            />

            <InputField
              label="Plan ID"
              value={newData.planId || ""}
              onChange={(v) => setNewData({ ...newData, planId: v })}
              options={planOptions}
            />

            <InputField
              label="Status"
              value={newData.status || ""}
              onChange={(v) => setNewData({ ...newData, status: v })}
              options={[
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
                { label: "Canceled", value: "canceled" },
                { label: "Trialing", value: "trialing" },
                { label: "Past Due", value: "past_due" },
              ]}
            />

            <InputField
              label="Billing Interval"
              value={newData.billingInterval || ""}
              onChange={(v) =>
                setNewData({ ...newData, billingInterval: v })
              }
            />

            <InputField
              label="Amount Paid"
              type="number"
              value={newData.amountPaid || ""}
              onChange={(v) =>
                setNewData({ ...newData, amountPaid: v })
              }
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={creating}
            className="mt-6 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold shadow disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create Subscription"}
          </button>
        </div>
      </div>
    </main>
  );
}

/* Reusable Dark Input Component */
function InputField({
  label,
  value,
  onChange,
  type = "text",
  options
}: {
  label: string;
  value: any;
  onChange: (v: any) => void;
  type?: string;
  options?: { label: string; value: string }[];
}) {
  return (
    <label className="block text-sm font-medium text-slate-300">
      {label}
      {options ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:ring-[#f97316] focus:border-transparent"
        >
          <option value="">Select {label}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:ring-[#f97316] focus:border-transparent"
        />
      )}
    </label>
  );
}
